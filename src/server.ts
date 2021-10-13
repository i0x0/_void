require("dotenv").config();

import cuid from "cuid";
import Fastify from "fastify";
import Blockchain from "./blockchain";
import {
  BlockData,
  BlockDataType,
  RegisterNodes,
  RegisterNodesType,
} from "./schemas";

const fastify = Fastify({
  logger: true,
});

// init stuff
const NODE_IDENTIFIER = cuid();
let blockchain = new Blockchain({
  node_identifier: NODE_IDENTIFIER,
});

fastify.get("/mine", (_, reply) => {
  let lastBlock = blockchain.lastBlock();
  let lastProof = lastBlock.proof;
  let proof = blockchain.POW(lastProof);

  let previousHash = blockchain.hash(lastBlock);
  let block = blockchain.newBlock({
    proof: proof,
    previousHash: previousHash,
  });

  reply.send({
    message: "New block forged",
    index: block.index,
    data: block.data,
    proof: block.proof,
    previousHash: block.previousHash,
  });
  // reply.send("Currently mining a block...");
});

fastify.post<{ Body: BlockDataType }>(
  "/data/new",
  {
    schema: {
      body: BlockData,
    },
  },
  (res, reply) => {
    let index = blockchain.newData({
      name: res.body.name,
      data: res.body.data,
      metadata: res.body.metadata,
    });
    reply.code(201).send({
      message: `Data will be added to block ${index}`,
      blockIndex: index,
    });
  }
);

fastify.get("/chain", (_, reply) => {
  reply.send({
    chain: blockchain.chain,
    length: blockchain.chain.length,
  });
});

fastify.post<{ Body: RegisterNodesType }>(
  "/nodes/register",
  {
    schema: {
      body: RegisterNodes,
    },
  },
  (res, reply) => {
    res.body.nodes.forEach((x) => {
      blockchain.registerNode(x);
    });
    reply.status(201).send({
      message: "New nodes created",
      totalNodes: Array.from(blockchain.nodes),
    });
  }
);

fastify.get("/nodes/resolve", (_, reply) => {
  let replaced = blockchain.resolveConflicts();
  let res = {
    message: "",
    newChain: blockchain,
  };

  if (replaced) {
    res.message = "Chain replaced";
  } else {
    res.message = "Chain is alright";
  }

  reply.send(res)
});

fastify.get("/", (_, reply) => {
  reply.send({
    id: NODE_IDENTIFIER,
  });
});

fastify.listen(Number(process.env.PORT), '0.0.0.0', (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
