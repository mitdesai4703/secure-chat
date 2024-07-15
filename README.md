Secure Chat is an advanced messaging application built to prioritize security and privacy. It utilizes cutting-edge technologies including React, Express, Socket.io, MongoDB, Node.js, LDAP, and OpenSSL to ensure end-to-end encryption for all communications.

Features:

LDAP Integration: Secure user authentication and login via LDAP.

Real-Time Messaging: Instant messaging capabilities powered by Socket.io.

API Security: Tokens for secure API calls to the backend server.

Session Management: Cookies for persistent sessions across browser refreshes.

Private Messaging: Asymmetric encryption ensures that all messages between users are securely transmitted and stored.

Prerequisites:

Apache Directory Studio: Download and install Apache Directory Studio from [here](https://directory.apache.org/studio/downloads.html). Configure it in `server/config/ldap-client`.

Self-Signed Certificate: Generate a self-signed certificate for user authentication and store it in `server/openssl/CA`.

How It Works:

1.Account Setup: Users create accounts with locally generated public/private key pairs, storing the keys securely in localStorage. They submit their public key and credentials to the server.

2.Server-Side Processing: The server receives user credentials and public keys, generates certificates, and stores user data securely in LDAP.

3.Secure Messaging: Users exchange and store each other's certificates locally. Messages are encrypted using recipient certificates before transmission and storage in MongoDB.

4.Data Security: Encrypted messages are securely stored in MongoDB, ensuring confidentiality and integrity of user communications.
