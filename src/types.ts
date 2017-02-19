import * as ts from 'typescript'

export function createTypeReference (...args: any[]): any
export function createTypeReference (name: string, args?: any[]): any {
  return Object.assign(
    {},
    ts.createNode(ts.SyntaxKind.TypeReference),
    {
      typeName: ts.createIdentifier(name),
      typeArguments: ts.createNodeArray(args)
    }
  )
}

export const createPropertySignature = (name: any, type: any, optional?: boolean) => Object.assign(
  {},
  ts.createNode(ts.SyntaxKind.PropertySignature),
  {
    name: typeof name === 'string' ? ts.createIdentifier(name) : name,
    questionToken: optional && ts.createToken(ts.SyntaxKind.QuestionToken),
    type
  }
)

export const createInterfaceDeclaration = (name: string, members: any[]) => Object.assign(
  {},
  ts.createNode(ts.SyntaxKind.InterfaceDeclaration),
  {
    name: ts.createIdentifier(name),
    members: ts.createNodeArray(members)
  }
)

export const createUnionType = (types: any[]) => Object.assign(
  {},
  ts.createNode(ts.SyntaxKind.UnionType),
  {
    types: ts.createNodeArray(types)
  }
)

export const createTypeAliasDeclaration = (name: string, type: any) => Object.assign(
  {},
  ts.createNode(ts.SyntaxKind.TypeAliasDeclaration),
  {
    name: ts.createIdentifier(name),
    type
  }
)

export const createExport = (node: any) => Object.assign(
  {},
  node,
  { modifiers: [ ...(node.modifiers || []), ts.createToken(ts.SyntaxKind.ExportKeyword) ] }
)

export const interfaceType = (name: string, args: any) => createInterfaceDeclaration(
  name,
  Object.keys(args).map(k => createPropertySignature(k, args[k]))
)

export const createImports = (names: string[], from: string) => ts.createImportDeclaration(
  [],
  [],
  Object.assign(ts.createImportClause(
    ts.createIdentifier(''),
    ts.createNamedImports(names.map(name =>
      ts.createImportSpecifier(undefined, ts.createIdentifier(name))
    ))
  ), { name: undefined }),
  ts.createLiteral(from)
)
