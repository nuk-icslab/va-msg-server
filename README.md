# 5G Messaging Server

A demo repository to illustrate the usage of SEAL/VAL framework for 5G vertical application.

## Installation

- Install [Node.js](https://nodejs.org/en/) first
- Then, execute the following command

```bash
npm install
```

- Finally, put the SSL/TLS private key and certificate in the directory certs/

```bash
mkdir certs/
cp /path/to/server.key /path/to/server.crt certs/
```

## Usage

```bash
npm start
```

Then the server will listen to port 443
