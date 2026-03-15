import type { ReactElement, ReactNode } from "react"
import { parseCharacterManager } from "./parser"
import { PsdCharacter } from "../character-unit"
import { DeclareCharacters, Senario } from "./character-manager-component"
import { Clip, ClipSequence } from "../../clip"
import type { OneOrMany } from "../utils/util-types"


type DialogueSenarioProps = {
  children: OneOrMany<ReactElement<typeof DeclareCharacters> | ReactElement<typeof Senario>>
}

export const DialogueSenario = ({
  children
}: DialogueSenarioProps) => {
  const ast = parseCharacterManager(children)

  const characters = new Map(ast.characters.children.map(character => {
    return [
      character.name,
      {
        psd: character.psd,
        waitingState: <PsdCharacter
          key={character.name}
          className={character.className}
          psd={character.psd}
        >
          {character.children}
        </PsdCharacter>
      }
    ]
  }))

  const senario = ast.senario.children.map(chapter => {
    const explicitSpeakers = chapter.children.filter(child => child.kind == "speaker").map(s => s.node.name)
    const implicitCharacters = Array.from(characters.entries()).filter(([key, _]) => !explicitSpeakers.includes(key))
    return <Clip>
      {chapter.children.map(elm => {
        if (elm.kind == "speaker") {
          return (
            <PsdCharacter key={elm.node.name} className={elm.node.className} psd={characters.get(elm.node.name)?.psd!}>
              {elm.node.children}
            </PsdCharacter>
          )
        } else {
          return elm.node
        }
      })}
      {implicitCharacters.map(([_, character]) => character.waitingState)}
    </Clip>
  })

  return (
    <ClipSequence>
      {senario}
    </ClipSequence>
  )
}
