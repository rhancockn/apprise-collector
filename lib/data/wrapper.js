const { storage } = require('arsenal');

const { config } = require('../Config');
const kms = require('../kms/wrapper');
const vault = require('../auth/vault');
const locationStorageCheck =
    require('../api/apiUtils/object/locationStorageCheck');
const { DataWrapper, MultipleBackendGateway, parseLC } = storage.data;
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
    // need to figure out how this listener will work
    let clients = parseLC(config, vault);
    config.on('location-constraints-update', () => {
        clients = parseLC(config, vault);
    });
    client = new MultipleBackendGateway(config, clients, locationStorageCheck);
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

const data = new DataWrapper(
    client, implName, config, kms, locationStorageCheck, vault);
module.exports = data;
