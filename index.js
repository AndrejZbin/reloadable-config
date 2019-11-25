'use strict';

const fs = require('fs');
const crypto = require('crypto');

class Config {
    constructor () {
        // object created at app load and never changed
        this._config = {
            file: undefined,
            autoreload: 0,
            watchfile: true,
            on_reload_begin: () => {},
            on_reload_end: () => {},
            defaults: {}
        };
        // object created at first reload and
        this._staticConfig = {};
        // object updated every time reload is called
        this._dynamicConfig = {};
        // callbacks called when reload is called with old config and new config as params
        this._callbacks = {};
        // config was at least once loaded
        this._initialized = false;
        // interval
        this._autoreload = null;
        // watch
        this._watch = null;
    }

    setup (config, reload = true) {
        // override default settings with specified settings
        Object.assign(this._config, config);
        // first we copy passed object so it's not modified
        const defaultsStatic = Object.assign({}, this._config.defaults);
        const defaultsDynamic = Object.assign({}, this._config.defaults);
        // then we assign current values to defaults, so we keep values we already have and add defaults for values we dont have
        // the result is already a new config, but we can't replace it with =, so we use assign again
        Object.assign(this._staticConfig, Object.assign(defaultsStatic, this._staticConfig));
        Object.assign(this._dynamicConfig, Object.assign(defaultsDynamic, this._dynamicConfig));
        if (config.hasOwnProperty('autoreload')) {
            if (this._autoreload != null) {
                clearInterval(this._autoreload);
                this._autoreload = false;
            }
            if (config.autoreload) {
                this._autoreload = setInterval(() => this.reload(), config.autoreload);
            }
        }
        if (config.hasOwnProperty('file') || config.hasOwnProperty('watchfile')) {
            if (this._watch != null) {
                this._watch.close();
                this._watch = null;
            }
            if (this._config.watchfile) {
                this._watch = fs.watch(this._config.file, (eventType, filename) => {
                    if (eventType === 'change') {
                        this.reload();
                    }
                });
            }
        }
        if (reload) this.reload();
        return this;
    }

    stop () {
        if (this._watch != null) this._watch.close();
        if (this._autoreload != null) clearInterval(this._autoreload);
    }

    reload () {
        this._config.on_reload_begin();
        // verify file exists
        try {
            require.resolve(this._config.file);
        } catch (e) {
            console.error(`Error while loading config file \`${this._config.file}\`.`);
            // throw error only if file was never loaded
            if (!this._initialized) throw Error('Cannot load config file')
        }
        const oldConfig = Object.assign({}, this._dynamicConfig);
        delete require.cache[this._config.file];
        const newConfig = Object.assign(Object.assign({}, this._config.defaults), require(this._config.file));

        for (const prop of Object.keys(this._dynamicConfig)) {
            delete this._dynamicConfig[prop];
        }
        // first load, set the static config
        if (!this._initialized) {
            this._initialized = true;
            Object.assign(this._staticConfig, newConfig);
        }
        Object.assign(this._dynamicConfig, newConfig);

        for (const callback of Object.values(this._callbacks)) {
            if (callback.watch === '*') {
                callback.fun(newConfig, oldConfig);
            } else {
                for (const p of callback.watch) {
                    if (oldConfig[p] + '' !== newConfig[p] + '') {
                        callback.fun(newConfig, oldConfig);
                        break;
                    }
                }
            }
        }
        this._config.on_reload_end();
    }

    subscribe (callback) {
        // only function with default config
        if (typeof callback !== 'object') {
            callback = {
                handler: callback
            }
        }
        // assign default values
        const _options = Object.assign({
            id: crypto.randomBytes(12).toString('hex'),
            init_call: true,
            watch: '*'
        }, callback);
        if (!(callback.handler instanceof Function)) {
            throw new Error('Callback is not a function');
        }
        this._callbacks[_options.id] = {
            fun: callback.handler,
            watch: _options.watch
        };
        if (_options.init_call) {
            callback.handler(this._dynamicConfig, null);
        }
    }

    unsubscribe (id) {
        delete this._callbacks[id];
    }

    get loaded () {
        return this._initialized;
    }

    get dynamicConfig () {
        if (!this._initialized) throw Error('Config not loaded');
        return this._dynamicConfig;
    }

    get staticConfig () {
        if (!this._initialized) throw Error('Config not loaded');
        return this._staticConfig;
    }

    get d () {
        return this.dynamicConfig;
    }

    get s () {
        return this.staticConfig;
    }

    toString () {
        return this._config.file;
    }
}

module.exports = new Config();
