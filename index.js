import { parseTorrentFile } from "./parser.js";
import { getPeers } from "./tracker.js";
import { connectToPeer } from "./peer.js";
import bencode from "bencode";
import fs from "fs";
import crypto from "crypto";

const torrentFile = "./enigma.torrent";
const port = 6881;

(async () => {
  const torrent = parseTorrentFile(torrentFile);

  const torrentt = fs.readFileSync(torrentFile);

  const decoded = bencode.decode(torrentt);
  const info = decoded.info;

  const sha1 = crypto.createHash("sha1");
  sha1.update(bencode.encode(info)); 
  console.log(sha1.digest("hex")); 
  const peerPrefix = "-PC0001-"; 
  const randomString = crypto.randomBytes(12).toString("hex"); 

  console.log(peerPrefix + randomString); 

  console.log("Torrent Metadata:", torrent);

  getPeers(torrent, port, (peers) => {
    console.log("Peers:", peers);

    for (const peer of peers) {
      connectToPeer(peer, torrent, torrent.pieces, (piece) => {
        console.log("Downloaded piece:", piece);
      });
    }
  });
})();
