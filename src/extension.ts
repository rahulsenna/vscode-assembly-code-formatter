// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {


	  // 👍 formatter implemented using API
	let document_formatter = vscode.languages.registerDocumentFormattingEditProvider('asm-collection', {
		provideDocumentFormattingEdits(document: vscode.TextDocument): any | vscode.TextEdit[] {
			const firstLine = document.lineAt(0);
			if (firstLine.text !== '42')     {
  				return [vscode.TextEdit.insert(firstLine.range.start, '42\n')];
			}
        }
    });

	let range_formatter = vscode.languages.registerDocumentRangeFormattingEditProvider('asm-collection', {
        provideDocumentRangeFormattingEdits(document: vscode.TextDocument, range: vscode.Range, options: vscode.FormattingOptions): vscode.TextEdit[] {

			const semicolon  = ';';
			const TAB_SIZE   = options.tabSize;
			let   first_line = range.start.line;
			const last_line  = range.end.line;

			let first_comment_pos = document.lineAt(first_line).text.indexOf(semicolon);
			while (first_comment_pos === -1 && first_line < last_line)
				first_comment_pos = document.lineAt(++first_line).text.indexOf(semicolon);

			if (first_comment_pos === -1 || first_line === last_line)
				return [];
			const edits: vscode.TextEdit[] = [];
		
			let whole_text = document.getText(range);
			if (whole_text.indexOf(" \t") !== -1)
			{
				const o = whole_text.replace(/ +\t|\t +/g, '\t\t');
				return [vscode.TextEdit.replace(range, o)];
			}

			const first_text = document.lineAt(first_line).text;
			const match = first_text.match(/^(\t*)(\w+)(\t+)([^\t]+)(\t*).*$/);

			if (!match)
				return [];

			const begin_tab_count   = match[1].length;
			const first_symbol_len  = match[2].length;
			const middle_tab_count  = match[3].length;
			const second_symbol_len = match[4].length;
			const end_tab_count     = match[5].length;

			const middle_tab_extra  = Math.floor(first_symbol_len / TAB_SIZE);
			const end_tab_extra     = Math.floor(second_symbol_len / TAB_SIZE);



			for (let idx = first_line+1; idx < last_line; idx++)
			{
				const line = document.lineAt(idx);
				const current_comment_pos = line.text.indexOf(semicolon);
				if (current_comment_pos === -1)
					continue

				const current_line_match = line.text.match(/^(\t*)(\w+)(\t+)([^\t]+)(\t*)(.*)$/);
	
				if (!current_line_match)
					continue				
	
				const c_begin_tab_count   = current_line_match[1].length;
				const c_middle_tab_count  = current_line_match[3].length;
				const c_end_tab_count     = current_line_match[5].length;
	
				const first_symbol  = current_line_match[2];
				let  second_symbol  = current_line_match[4];
				let  comment        = current_line_match[6];

				if (c_end_tab_count === 0)
				{
					const sl = second_symbol.indexOf(';');
					comment = second_symbol.slice(sl) // NOTE: (IMPORTANT) Don't change the order of following two lines
					second_symbol = second_symbol.slice(0,sl);
				}
				const c_middle_tab_extra  = Math.floor(first_symbol.length / TAB_SIZE);
				const c_end_tab_extra 	  = Math.floor(second_symbol.length / TAB_SIZE);

				if (begin_tab_count   === c_begin_tab_count &&
					first_symbol_len  === first_symbol.length &&
					middle_tab_count  === c_middle_tab_count &&
					second_symbol_len === second_symbol.length &&
					end_tab_count     === c_end_tab_count)
					continue;
								
				
				const target_tab_amt_middle = middle_tab_count + middle_tab_extra;
				const target_tab_amt_end = end_tab_count + end_tab_extra;

				const begin_tab_txt  = "\t".repeat(begin_tab_count);
				const middle_tab_txt = "\t".repeat(target_tab_amt_middle - c_middle_tab_extra);
				const end_tab_txt 	 = "\t".repeat(target_tab_amt_end - c_end_tab_extra);

				const output = begin_tab_txt + first_symbol + middle_tab_txt + second_symbol + end_tab_txt + comment;
					
				
				edits.push(
					vscode.TextEdit.replace(line.range, output)
				)
			}
			return edits;
		}
    });

	context.subscriptions.push(document_formatter, range_formatter);

}

// This method is called when your extension is deactivated
export function deactivate() {}
