/**
 * Activity Mosaic Gallery - 管理画面スクリプト
 *
 * Classic Editor の「メディアを追加」ボタン付近に専用ボタンを追加し、
 * WordPress 標準のメディアライブラリで複数画像を選択、
 * ショートコードを本文に自動挿入する。
 */
(function ($) {
	'use strict';

	var frame = null;

	/**
	 * 専用ボタンをエディタ上部に追加
	 */
	function addGalleryButton() {
		var $insertArea = $('#wp-content-media-buttons');
		if (!$insertArea.length || $('#amg-insert-gallery').length) {
			return;
		}

		var btn = $(
			'<button type="button" id="amg-insert-gallery" class="button">' +
				'<span class="dashicons dashicons-format-gallery"></span> ' +
				'活動ギャラリー挿入' +
			'</button>'
		);

		$insertArea.append(btn);
	}

	/**
	 * メディアライブラリを開いて複数画像を選択
	 */
	function openMediaLibrary() {
		if (frame) {
			frame.open();
			return;
		}

		frame = wp.media({
			title: amgAdmin.title,
			button: { text: amgAdmin.buttonText },
			multiple: true,
			library: { type: 'image' }
		});

		frame.on('select', function () {
			var selection = frame.state().get('selection');
			var ids = [];

			selection.each(function (attachment) {
				ids.push(attachment.id);
			});

			if (ids.length > 0) {
				insertShortcode(ids);
			}
		});

		frame.open();
	}

	/**
	 * ショートコードをエディタに挿入
	 *
	 * @param {number[]} ids 画像 ID の配列
	 */
	function insertShortcode(ids) {
		var shortcode = '[activity_gallery ids="' + ids.join(',') + '"]';

		// Classic Editor (TinyMCE) が有効な場合
		if (
			typeof tinymce !== 'undefined' &&
			tinymce.activeEditor &&
			!tinymce.activeEditor.isHidden()
		) {
			tinymce.activeEditor.execCommand('mceInsertContent', false, shortcode + '\n');
		}
		// テキストモードの場合
		else if (typeof QTags !== 'undefined') {
			QTags.insertContent(shortcode + '\n');
		}
		// フォールバック
		else {
			var $textarea = $('#content');
			if ($textarea.length) {
				var current = $textarea.val();
				var pos = $textarea[0].selectionStart || current.length;
				$textarea.val(
					current.substring(0, pos) + shortcode + '\n' + current.substring(pos)
				);
			}
		}
	}

	// DOM Ready
	$(function () {
		addGalleryButton();

		$(document).on('click', '#amg-insert-gallery', function (e) {
			e.preventDefault();
			openMediaLibrary();
		});
	});
})(jQuery);
