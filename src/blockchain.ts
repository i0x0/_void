import axios, { AxiosInstance } from "axios";
import crypto from "crypto";
const pkg = require("../package.json")

//DEPRECATED (i think lol)
export interface BlockchainOptions {
  node_identifier: string;
}

type hash = string

export interface ChainRes {
  chain: Block[];
  length: number;
}

export interface Block {
  index: number;
  hash: hash
  timestamp: number;
  data: BlockData[];
  proof: number;
  previousHash: hash;
}

export interface BlockData {
  name: string;
  data: string;
  metadata: string;
}

export interface NewBlockOptions {
  proof: number;
  previousHash?: hash;
}

export default class Blockchain {
  public chain: Block[];
  public currentData: BlockData[];
  public nodes: Set<string>;
  public settings: BlockchainOptions;
  private httpClient: AxiosInstance;

  constructor(options: BlockchainOptions) {
    this.chain = [];
    this.currentData = [];
    this.nodes = new Set();
    this.settings = options;
    this.httpClient = axios.create({
      headers: {
        "User-Agent": `Void Blockchain Node ID:${this.settings.node_identifier} Version: ${pkg.version}`,
      },
    });
    // origin block
    this.newBlock({ proof: 734, previousHash: "g3n3s1s_bl0ck" });
  }

  newData(x: BlockData): number {
    this.currentData.push(x);
    return this.lastBlock().index + 1;
  }

  newBlock(x: NewBlockOptions): Block {
    let uhh = (): string => {
      let z: string;
      if (x.previousHash) {
        z = x.previousHash;
      } else {
        z = this.hash(this.chain[this.chain.length - 1]);
      }
      return z;
    };
    const block: Block = {
      index: this.chain.length,
      hash: "",
      timestamp: Date.now(),
      data: this.currentData,
      proof: x.proof,
      previousHash: uhh(),
    };
    block.hash = hash(block.index + block.previousHash + block.timestamp + JSON.stringify(block.data))
    this.currentData = [];
    this.chain.push(block);
    return block;
  }

  hash(block: Block): string {
    let _block = JSON.stringify(block);
    let _hash = hash(_block);
    return _hash;
  }

  lastBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  POW(lastProof: number): number {
    let proof = 0;
    while (this.validProof(lastProof, proof) === false) {
      proof += 1;
    }
    return proof;
  }
  validProof(lastProof: number, proof: number): boolean {
    let guess = `${lastProof}${proof}`;
    let guessHash = hash(guess);
    return guessHash.substring(guessHash.length - 4) === "0000";
  }

  registerNode(address: string): void {
    let url = new URL(address);
    let _url = url.host;

    this.nodes.add(_url);
  }

  validChain(chain: Block[]): boolean {
    let lastBlock = chain[0];
    let currentIndex = 1;

    let res: boolean = true;

    while (currentIndex < chain.length) {
      let block = chain[currentIndex];
      log(lastBlock);
      log(block);
      lines(9);
      if (block.previousHash !== this.hash(lastBlock)) {
        res = false;
      }

      if (!this.validProof(lastBlock.proof, block.proof)) {
        res = false;
      }
      lastBlock = block;
      currentIndex += 1;
    }

    return res;
  }

  resolveConflicts(): boolean {
    let neighbours = this.nodes;
    let newChain = null;
    let res: boolean = false
    let max_length = this.chain.length;

    neighbours.forEach((x) => {
      this.httpClient.get<ChainRes>(`http://${x}/chain`).then((res) => {
        if (res.status === 200) {
          let length = res.data.length;
          let chain = res.data.chain;

          if (length > max_length && this.validChain(chain)) {
            max_length = length
            newChain = chain
          }
        }
      });
    });
    if (newChain) {
      this.chain = newChain
      res = true
    }
    return res
  }
}

// utils
export const hash = (x: any): string =>
  crypto.createHash("sha256").update(x).digest("hex");

const log = console.log;
export const lines = (x: number): void => log("-".repeat(x));
