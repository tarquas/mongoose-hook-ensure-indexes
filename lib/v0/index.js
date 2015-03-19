'use strict';

var pluginSpec = 'mongooseHookEnsureIndexes_2015_03';
var pluginSpec_enabled = pluginSpec + '_enabled';

var thisPlugin = {};

// hook for mongoose.model
thisPlugin.ensureIndexes = function(cb) {
  var props = this[pluginSpec];

  // if the schema is not marked with this plugin, just use standard method.
  if (!this.schema[pluginSpec_enabled]) return props.ensureIndexesHooked.apply(this, arguments);

  var promise = new props.mongoose.Promise(cb);

  var _this = this;

  var indexes = _this.schema.indexes();
  
  var W = {};

  W.start = function() {
    _this.collection.indexes(W.gotIndexes);
  };

  var existing;

  W.gotIndexes = function(err, result) {
    if (err) return W.finish(err);
    existing = {};
    var i;
    for (i in result) {
      existing[result[i].name] = result[i];
    };
    delete existing._id_;
    W.iterCreate(0);
  };

  W.iterCreate = function(i, recreated) {
    if (i >= indexes.length) return W.created();
    var index = indexes[i];
    _this.collection.createIndex(index[0], index[1], function(err, indexName) {
      if (err && err.code === 85) {
        indexName = err.err.match(/:\s(\S+)\s/);
        if (!indexName) return W.finish(err);
        indexName = indexName[1];
      }
      else if (err) return W.finish(err);
      delete existing[indexName];
      if (err) {
        if (recreated) return W.finish(err);
        W.reIndex(indexName, i);
      } else W.iterCreate(i + 1);
    });
  };

  W.reIndex = function(indexName, i) {
    _this.collection.dropIndex(indexName, {background: true}, function(err, dropped) {
      W.iterCreate(i, true);
    });
  };

  var toDrop;

  W.created = function() {
    toDrop = Object.keys(existing);
    W.iterDrop(0);
  };

  W.iterDrop = function(i) {
    if (i >= toDrop.length) return W.finish();
    var indexName = toDrop[i];
    _this.collection.dropIndex(indexName, {background: true}, function(err, dropped) {
      W.iterDrop(i + 1);
    });
  };

  W.finish = function(err) {
    _this.emit('index', err);
    promise.resolve(err);
  };

  W.start();

  return promise;
};

// makes given mongoose object affected by this plugin
function patchMongoose(mongoose) {
  // patch only once
  if (mongoose[pluginSpec]) return false;

  var MM = mongoose.Model;

  // mark mongoose as patched
  mongoose[pluginSpec] =
  MM[pluginSpec] = {
    mongoose: mongoose,
    ensureIndexesHooked: MM.ensureIndexes
  };

  // hook the ensureIndexes
  MM.ensureIndexes = thisPlugin.ensureIndexes;

  return true;
}

// Mongoose plugin

// opts = {
//   mongoose: Mongoose
// }
module.exports = function(schema, opts) {
  schema[pluginSpec_enabled] = true;
  patchMongoose(opts.mongoose);
};
