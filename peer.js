import net from 'net';
import crypto from 'crypto';

/**
 * Handles peer connections and data exchange.
 * @param {object} peer Peer information (IP and port).
 * @param {object} torrent Torrent metadata.
 * @param {Buffer} pieceHashes List of piece hashes.
 * @param {function} callback Callback to handle downloaded pieces.
 */
export function connectToPeer(peer, torrent, pieceHashes, callback) {
    const socket = net.createConnection(peer.port, peer.ip);

    socket.on('connect', () => {
        const handshake = createHandshake(torrent.infoHash);
        socket.write(handshake);
    });

    socket.on('data', data => {
    });

    socket.on('error', error => {
        console.error(`Error connecting to peer: ${error.message}`);
    });

    socket.on('close', () => {
        console.log('Connection closed');
    });

    function createHandshake(infoHash) {
        const buffer = Buffer.alloc(68);
        buffer.writeUInt8(19, 0); 
        buffer.write('BitTorrent protocol', 1);ngth
        buffer.writeUInt32BE(0, 20); 
        buffer.writeUInt32BE(0, 24);
        infoHash.copy(buffer, 28);
        crypto.randomBytes(20).copy(buffer, 48);
        return buffer;
    }
}
