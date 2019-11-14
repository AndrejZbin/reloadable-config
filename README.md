# Install

```sh
npm install @gfxpulse/reloadable-config
```
### Functions

| Function, property |  Description |
|--------|---------------------------------|
| `setup(setupOptions, reload=true)`| Config of reloadable-config |
| `subscribe(subscribeOptions)` | Registers callback on config changes |
| `unsubscribe(id)` | Removed callback |
| `reload()` | Reloads config |
| `stop()` | Clears any timeouts, file watches, etc... |
| `d`, `dynamicConfig` | Values loaded on most recent reload |
| `s`, `staticConfig` | Values loaded on initial setup |
| `loaded` | Indicated whether config was successfully loaded at least once |

### Setup options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `autoreload` | `int` | `0` | How often (in ms) is reload automatically called |
| `watchfile` | `int` | `null` | Automatically call reload on file change |
| `file` | `string` | `null` | Full path to config file |
| `defaults` | `Object` | `{}` | Default values if not present in file |
| `on_reload_begin` | `Function` | `() => {}` | Function called before reload starts |
| `on_reload_end` | `Function` | `() => {}` | Function called after reload finishes and all callbacks are called |

### Subscribe options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | `string` | `random` | Identifier used for unsubscribing |
| `init_call` | `bool` | `true` | Call handler instantly with old_conf = null |
| `watch` | `'*'` or `Array`  | `'*'` | Handler called only when property or properties in array are changed, use '*' for any |
| `handler` | `Function` | `(new_config, old_config) => {}` | Function called when change is detected |

# Example
Code:

```js
const path = require('path');

const config = require('./../index.js').setup({
    watchfile: true,
    file: path.resolve('./settings.js'),
    defaults: {
        VALUE3: 72,
    }
});

config.subscribe({
    watch: ['VALUE1'],
    init_call: false,
    handler: (conf, old_conf) => {
        if (config.d.PRINT) {
            console.log(`VALUE1 changed from ${old_conf.VALUE1} to ${conf.VALUE1} (initial value ${config.s.VALUE1})`)
        }
    }
});

config.subscribe({
    watch: ['VALUE2'],
    init_call: false,
    handler: (conf, old_conf) => {
        if (config.d.PRINT) {
            console.log(`VALUE1 changed from ${old_conf.VALUE2} to ${conf.VALUE2} (initial value ${config.s.VALUE2})`)
        }
    }
});

config.subscribe({
    watch: ['VALUE3'],
    init_call: true,
    handler: (conf, old_conf) => {
        console.log(`VALUE3 = ${conf.VALUE3}`)
    }
});



```
initial settings.js:
```js
module.exports = {
    'VALUE1': 1,
    'VALUE2': 2,
    'PRINT': true,
};
````

Output:
```
VALUE3 = 72
```
changed settings.js:
```js
module.exports = {
    'VALUE1': 11,
    'VALUE2': 2,
    'PRINT': true,
};
````
Output:
```
VALUE1 changed from 1 to 11 (initial value 1)
```
changed settings.js:
```js
module.exports = {
    'VALUE1': 111,
    'VALUE2': 2,
    'PRINT': true,
};
````
Output:
```
VALUE1 changed from 11 to 111 (initial value 1)
```
changed settings.js:
```js
module.exports = {
    'VALUE1': 11,
    'VALUE2': 2,
    'PRINT': false,
};
````
Output:
```
```
changed settings.js:
```js
module.exports = {
    'VALUE1': 11,
    'VALUE2': 22,
    'PRINT': false,
};
````
Output:
```
```
changed settings.js:
```js
module.exports = {
    'VALUE1': 1,
    'VALUE2': 2,
    'PRINT': true,
};
````
Output:
```
VALUE1 changed from 11 to 1 (initial value 1)
VALUE1 changed from 22 to 2 (initial value 2)
```

changed settings.js:
```js
module.exports = {
    'VALUE1': 2,
    'VALUE2': 1,
    'VALUE3': 3,
    'PRINT': true,
};
````
Output:
```
VALUE3 = 3
```

changed settings.js:
```js
module.exports = {
    'VALUE1': 2,
    'VALUE2': 1,
    'PRINT': true,
};
````
Output:
```
VALUE3 = 72
```