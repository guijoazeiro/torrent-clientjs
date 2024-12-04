import fs from 'fs';
import bencode from 'bencode';
import crypto from 'crypto';

/**
 * Parses a .torrent file and extracts metadata.
 * @param {string} filePath Path to the .torrent file.
 * @returns {object} Parsed torrent metadata.
 */
export function parseTorrentFile(filePath) {
    const data = fs.readFileSync(filePath);
    const torrent = bencode.decode(data);

    const info = bencode.encode(torrent.info);
    const infoHash = crypto.createHash('sha1').update(info).digest();

    return {
        announce: torrent['announce'],
        infoHash: infoHash,
        pieceLength: torrent.info['piece length'],
        pieces: Buffer.from(torrent.info.pieces, 'binary'),
        length: torrent.info.length,
        name: torrent.info.name
    };
}
