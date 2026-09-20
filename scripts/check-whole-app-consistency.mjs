import {createServer} from 'vite'
import {createElement as h} from 'react'
import {renderToStaticMarkup as render} from 'react-dom/server'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import ts from 'typescript'
const app=fs.readFileSync('src/App.tsx','utf8'),tree=ts.createSourceFile('App.tsx',app,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX)
const view=tree.statements.find(n=>ts.isTypeAliasDeclaration(n)&&n.name.text==='View'),views=new Set(view.type.types.filter(ts.isLiteralTypeNode).map(n=>n.literal.text));let count=0
function walk(dir){for(const file of fs.readdirSync(dir)){const name=path.join(dir,file);if(fs.statSync(name).isDirectory())walk(name);else if(name.endsWith('.tsx')){const src=ts.createSourceFile(name,fs.readFileSync(name,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(src)==='navigate'&&n.arguments[0]&&ts.isStringLiteral(n.arguments[0])){assert.ok(views.has(n.arguments[0].text),name+' unknown route '+n.arguments[0].text);count++}ts.forEachChild(n,visit)}visit(src)}}}walk('src')
const server=await createServer({server:{middlewareMode:true,hmr:false},appType:'custom'})
try{
 const {StatusBadge}=await server.ssrLoadModule('/src/design/foundation.tsx')
 for(const status of ['Unverified','Not Started','Inactive']){const html=render(h(StatusBadge,{status}));assert.ok(!html.includes('tcs-success-soft'),status);count++}
 for(const status of ['Verified','Completed']){assert.ok(render(h(StatusBadge,{status})).includes('tcs-success-soft'));count++}
 for(const status of ['Locked','Security Locked','Declined']){assert.ok(render(h(StatusBadge,{status})).includes('tcs-danger-soft'));count++}
 assert.ok(!render(h(StatusBadge,{status:'Unlocked'})).includes('tcs-danger-soft'));count++
 const rounds=fs.readFileSync('src/rounds/ActiveCycleWorkspace.tsx','utf8');assert.ok(!rounds.includes('navigate("owner-groups")'));assert.ok(!fs.readFileSync('src/rounds/ActiveCycleBody.tsx','utf8').includes('No payment allocation is performed'));count+=2
 console.log(count+' whole-app literal-navigation and status/copy regression checks passed. Dynamic navigation and authority covered by module route/service suites.')
}finally{await server.close()}
