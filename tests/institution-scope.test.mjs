import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
/** Current user-authorized starting commit, rather than an older November 20 checksum list. */
test('institution changes preserve the current designer/professional UI, frozen professional interfaces, global styles and tokens',()=>{
 const files=execFileSync('git',['diff','--name-only','2bc1fb082a837e8a3cb67647ee7490737c53a754','--','src/App.tsx','src/projects','src/cad','src/index.css','src/design-system/tokens.css','design-system/tokens.json','src/PageBack.tsx','src/WorkspaceTaskActions.tsx'],{encoding:'utf8'}).trim();assert.equal(files,'');
});
