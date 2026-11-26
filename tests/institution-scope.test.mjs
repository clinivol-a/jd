import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
/** Current user-authorized starting commit, rather than an older November 20 checksum list. */
test('institution changes preserve the current designer/professional UI, frozen professional interfaces, global styles and tokens',()=>{
 const files=execFileSync('git',['diff','--name-only','5b3c9b959ec501100330a4c24d9794478c5ad3e3','--','src/App.tsx','src/projects','src/cad','src/design-system/tokens.css','design-system/tokens.json','src/PageBack.tsx','src/WorkspaceTaskActions.tsx'],{encoding:'utf8'}).trim();assert.equal(files,'');
 const original=execFileSync('git',['show','5b3c9b959ec501100330a4c24d9794478c5ad3e3:src/index.css'],{encoding:'utf8'});
 const current=readFileSync('src/index.css','utf8').replace('/* Fixed columns retain TDesign sticky positioning; only ordinary first cells anchor task relations. */\n.app-table td:first-child:not(.t-table__cell--fixed-left):not(.t-table__cell--fixed-right) { position: relative; overflow: visible; }','.app-table td:first-child { position: relative; overflow: visible; }');
 assert.equal(current,original,'Only the authorized first-cell sticky override may change in shared CSS');
});
