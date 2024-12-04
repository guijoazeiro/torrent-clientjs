import dgram from 'dgram';
import crypto from 'crypto';
import { URL } from 'url';

/**
 * Validates and parses a URL.
 * @param {Uint8Array|string} urlValue URL string or Uint8Array from torrent metadata.
 * @returns {URL|null} Parsed URL object or null if invalid.
 */
function parseTrackerUrl(urlValue) {
    let urlString;
    if (urlValue instanceof Uint8Array) {
        urlString = Buffer.from(urlValue).toString('utf-8');
    } else if (typeof urlValue === 'string') {
        urlString = urlValue;
    } else {
        console.error(`Invalid tracker URL format: ${urlValue}`);
        return null;
    }

    try {
        return new URL(urlString);
    } catch (error) {
        console.error(`Invalid tracker URL: ${urlString}`);
        return null;
    }
}

/**
 * Communicates with the tracker and retrieves a list of peers.
 * @param {object} torrent Torrent metadata.
 * @param {number} port Listening port for the client.
 * @param {function} callback Callback to handle the list of peers.
 */
export function getPeers(torrent, port, callback) {
    const socket = dgram.createSocket('udp4');

    const trackerUrl = parseTrackerUrl(torrent.announce);
    if (!trackerUrl) {
        console.error('No valid tracker URL found.');
        return;
    }

    const trackerHost = trackerUrl.hostname;
    const trackerPort = parseInt(trackerUrl.port, 10);

    const connectionId = Buffer.from('0000041727101980', 'hex');
    const transactionId = crypto.randomBytes(4);
    const message = Buffer.concat([
        connectionId,
        Buffer.from('0000', 'hex'), 
        transactionId
    ]);

    console.log(`Connecting to tracker: ${trackerHost}:${trackerPort}`);
    socket.send(message, 0, message.length, trackerPort, trackerHost, () => {
        console.log('Sent connect message, waiting for response...');
        socket.once('message', response => {
            console.log('Received response from tracker:', response);
            if (response.length < 16) {
                console.error('Tracker response too short. Invalid response.');
                return;
            }
            const connectResponse = response.slice(8, 16); 
            console.log('Connection ID:', connectResponse.toString('hex'));

            const announceMessage = Buffer.concat([
                connectResponse,
                Buffer.from('0001', 'hex'), 
                transactionId,
                torrent.infoHash,
                crypto.randomBytes(20),
                Buffer.alloc(8, 0), 
                Buffer.alloc(8, torrent.length), 
                Buffer.alloc(8, 0), 
                Buffer.from('0000', 'hex'),
                Buffer.alloc(4, 0), 
                crypto.randomBytes(4), 
                Buffer.alloc(4, -1), 
                Buffer.alloc(2, port) 
            ]);
            console.log('Sending announce message...');
            socket.send(announceMessage, 0, announceMessage.length, trackerPort, trackerHost, () => {
                console.log('Announce message sent, waiting for response...');
                socket.once('message', announceResponse => {
                    console.log('Received announce response:', announceResponse);
                    if (announceResponse.length < 20) {
                        console.error('Invalid announce response.');
                        return;
                    }
                    const peers = parsePeers(announceResponse.slice(20));
                    console.log('Peers:', peers);
                    callback(peers);
                });
            });
        });
    });

    socket.on('error', err => {
        console.error('Socket error:', err);
    });
}

/**
 * Parses the peer list from the announce response.
 * @param {Buffer} buffer Announce response buffer.
 * @returns {Array} List of peers.
 */
function parsePeers(buffer) {
    const peers = [];
    for (let i = 0; i < buffer.length; i += 6) {
        peers.push({
            ip: `${buffer[i]}.${buffer[i + 1]}.${buffer[i + 2]}.${buffer[i + 3]}`,
            port: buffer.readUInt16BE(i + 4)
        });
    }
    return peers;
}
