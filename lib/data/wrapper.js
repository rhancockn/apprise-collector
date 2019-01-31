const { errors, s3middleware, storage } = require('arsenal');

const multipleBackendGateway = require('./multipleBackendGateway');
const { config } = require('../Config');
const kms = require('../kms/wrapper');
const constants = require('../../constants');
const { BackendInfo } = require('../api/apiUtils/object/BackendInfo');
const locationStorageCheck =
    require('../api/apiUtils/object/locationStorageCheck');
const { DataWrapper } = storage.data;
const { DataFileInterface } = storage.data.file;
const inMemory = storage.data.inMemory.datastore.backend;

let CdmiData;
try {
    CdmiData = require('cdmiclient').CdmiData;
} catch (err) {
    CdmiData = null;
}

let client;
let implName;

if (config.backends.data === 'mem') {
    client = inMemory;
    implName = 'mem';
} else if (config.backends.data === 'file') {
    client = new DataFileInterface(config);
    implName = 'file';
} else if (config.backends.data === 'multiple') {
    client = multipleBackendGateway;
    implName = 'multipleBackends';
} else if (config.backends.data === 'cdmi') {
    if (!CdmiData) {
        throw new Error('Unauthorized backend');
    }

    client = new CdmiData({
        path: config.cdmi.path,
        host: config.cdmi.host,
        port: config.cdmi.port,
        readonly: config.cdmi.readonly,
    });
    implName = 'cdmi';
}

const data = new DataWrapper(client, implName);
module.exports = data;
