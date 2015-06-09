# mongoose-hook-ensure-indexes
A mongoose plugin, improving 'Model.ensureIndexes' method, allowing also deletion of unused indexes and reindexing with changed options.

# Installation
```shell
git clone git@github.com:tarquas/mongoose-hook-ensure-indexes.git mongoose-hook-ensure-indexes
```

# Package
```js
{
  "mongoose-hook-ensure-indexes": "0.1.4"
}
```

# Usage

Example:

```js
var
  mongoose = require('mongoose'),
  ensureIndexes = require('mongoose-hook-ensure-indexes'),
  PersonSchema;

PersonSchema = {
  name: String,
  email: String
};

PersonSchema.index({name: 1});
PersonSchema.index({email: 1}, {unique: true});

PersonSchema.plugin(ensureIndexes, {mongoose: mongoose});

mongoose.model('Person', PersonSchema);
```

# Notes

* This plugin must be provided with an exact instance of `mongoose`, where the processing models expected to be processed, in `opts` parameter.

* This plugin makes sure that no other indexes persist on MongoDB collection than those, which specified in Schema. New indexes get created. Obsolete indexes get dropped. Indexes with changed options get recreated and rebuilt.
