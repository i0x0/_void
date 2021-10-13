import {Static, Type} from "@sinclair/typebox";

const BlockData = Type.Object({
  data: Type.String(),
  metadata: Type.String()
})

type BlockDataType = Static<typeof BlockData>

const RegisterNodes = Type.Object({
  nodes: Type.Array(
    Type.String()
  )
})

type RegisterNodesType = Static<typeof RegisterNodes>

export {
  BlockData,
  BlockDataType,
  RegisterNodes,
  RegisterNodesType
}
