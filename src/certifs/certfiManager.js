var forge = require('node-forge');

export const certif = () => {
    const keys = forge.pki.rsa.generateKeyPair(1024);
    const priKey = forge.pki.privateKeyToPem(keys.privateKey);
    const pubKey = forge.pki.publicKeyToPem(keys.publicKey);
    localStorage.setItem('priKey', priKey);
    localStorage.setItem('pubKey', pubKey);
    const csr = forge.pki.createCertificationRequest();
    csr.publicKey = keys.publicKey;
    csr.setSubject([{
        name: 'commonName',
        value: 'example.org'
    }, {
        name: 'countryName',
        value: 'US'
    }, {
        shortName: 'ST',
        value: 'Virginia'
    }, {
        name: 'localityName',
        value: 'Blacksburg'
    }, {
        name: 'organizationName',
        value: 'Test'
    }, {
        shortName: 'OU',
        value: 'Test'
    }]);
    csr.setAttributes([{
        name: 'challengePassword',
        value: 'password'
    }, {
        name: 'unstructuredName',
        value: 'My Company, Inc.'
    }, {
        name: 'extensionRequest',
        extensions: [{
            name: 'subjectAltName',
            altNames: [{
                type: 2,
                value: 'test.domain.com'
            }, {
                type: 2,
                value: 'other.domain.com',
            }, {
                type: 2,
                value: 'www.domain.net'
            }]
        }]
    }]);

    csr.sign(keys.privateKey);
    const pem = forge.pki.certificationRequestToPem(csr);
    return(pem);
}
