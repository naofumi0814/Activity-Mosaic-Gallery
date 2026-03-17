/**
 * Activity Mosaic Gallery - フロントエンドスクリプト
 *
 * jQuery ベースの軽量ライトボックス
 * キーボード操作・スワイプ対応
 */
(function ($) {
	'use strict';

	/* =============================
	 * ライトボックス
	 * ============================= */

	var LB = {
		$overlay: null,
		$img: null,
		$counter: null,
		$download: null,
		items: [],
		current: 0,
		isOpen: false,
		touchStartX: 0,
		touchStartY: 0,

		/**
		 * ライトボックス DOM を生成（初回のみ）
		 */
		build: function () {
			if (this.$overlay) return;

			// SVG アイコン
			var downloadIcon =
				'<svg class="amg-lb-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
				'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>' +
				'<polyline points="7 10 12 15 17 10"/>' +
				'<line x1="12" y1="15" x2="12" y2="3"/>' +
				'</svg>';

			var html =
				'<div class="amg-lightbox-overlay">' +
					'<div class="amg-lightbox-content">' +
						'<img src="" alt="" />' +
					'</div>' +
					'<button class="amg-lb-btn amg-lb-close" aria-label="' + amgFront.close + '">&times;</button>' +
					'<button class="amg-lb-btn amg-lb-prev" aria-label="' + amgFront.prev + '">&#10094;</button>' +
					'<button class="amg-lb-btn amg-lb-next" aria-label="' + amgFront.next + '">&#10095;</button>' +
					'<div class="amg-lb-toolbar">' +
						'<span class="amg-lb-counter"></span>' +
						'<a class="amg-lb-download" href="#" download>' +
							downloadIcon +
							'<span>' + amgFront.download + '</span>' +
						'</a>' +
					'</div>' +
				'</div>';

			this.$overlay = $(html).appendTo('body');
			this.$img = this.$overlay.find('.amg-lightbox-content img');
			this.$counter = this.$overlay.find('.amg-lb-counter');
			this.$download = this.$overlay.find('.amg-lb-download');

			this.bindEvents();
		},

		/**
		 * イベントバインド
		 */
		bindEvents: function () {
			var self = this;

			this.$overlay.on('click', '.amg-lb-close', function () {
				self.close();
			});

			this.$overlay.on('click', '.amg-lb-prev', function (e) {
				e.stopPropagation();
				self.prev();
			});

			this.$overlay.on('click', '.amg-lb-next', function (e) {
				e.stopPropagation();
				self.next();
			});

			// オーバーレイクリックで閉じる（画像・ボタン以外をクリック）
			this.$overlay.on('click', function (e) {
				if ($(e.target).hasClass('amg-lightbox-overlay')) {
					self.close();
				}
			});

			// キーボード操作
			$(document).on('keydown.amgLightbox', function (e) {
				if (!self.isOpen) return;

				switch (e.which) {
					case 27: // Escape
						self.close();
						break;
					case 37: // Left arrow
						self.prev();
						break;
					case 39: // Right arrow
						self.next();
						break;
				}
			});

			// スワイプ対応
			this.$overlay[0].addEventListener('touchstart', function (e) {
				self.touchStartX = e.changedTouches[0].screenX;
				self.touchStartY = e.changedTouches[0].screenY;
			}, { passive: true });

			this.$overlay[0].addEventListener('touchend', function (e) {
				var dx = e.changedTouches[0].screenX - self.touchStartX;
				var dy = e.changedTouches[0].screenY - self.touchStartY;

				// 横方向の移動量が十分で、縦方向より大きい場合のみスワイプと判定
				if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
					if (dx < 0) {
						self.next();
					} else {
						self.prev();
					}
				}
			}, { passive: true });
		},

		/**
		 * ライトボックスを開く
		 *
		 * @param {Array} items ギャラリー内の画像情報配列
		 * @param {number} index 開く画像のインデックス
		 */
		open: function (items, index) {
			this.build();
			this.items = items;
			this.current = index;
			this.show(index);

			this.$overlay.css('display', 'flex');
			// 表示直後に active クラスを追加（アニメーション用）
			var $overlay = this.$overlay;
			setTimeout(function () {
				$overlay.addClass('amg-active');
			}, 10);

			this.isOpen = true;
			$('body').css('overflow', 'hidden');
		},

		/**
		 * ライトボックスを閉じる
		 */
		close: function () {
			var self = this;
			this.$overlay.removeClass('amg-active');
			setTimeout(function () {
				self.$overlay.css('display', 'none');
			}, 250);
			this.isOpen = false;
			$('body').css('overflow', '');
		},

		/**
		 * 指定インデックスの画像を表示
		 *
		 * @param {number} index
		 */
		show: function (index) {
			var item = this.items[index];
			this.$img.attr('src', item.lightbox).attr('alt', item.alt);
			this.$download.attr('href', item.full);
			this.$counter.text(
				amgFront.counter
					.replace('%current%', index + 1)
					.replace('%total%', this.items.length)
			);
			this.current = index;

			// 前へ・次へボタンの表示制御
			this.$overlay.find('.amg-lb-prev').toggle(index > 0);
			this.$overlay.find('.amg-lb-next').toggle(index < this.items.length - 1);
		},

		/**
		 * 前の画像
		 */
		prev: function () {
			if (this.current > 0) {
				this.show(this.current - 1);
			}
		},

		/**
		 * 次の画像
		 */
		next: function () {
			if (this.current < this.items.length - 1) {
				this.show(this.current + 1);
			}
		}
	};

	/* =============================
	 * 初期化
	 * ============================= */

	$(function () {
		// ギャラリーリンクのクリックイベント
		$(document).on('click', '.amg-link', function (e) {
			e.preventDefault();

			var $link = $(this);
			var galleryId = $link.data('gallery');
			var $gallery = $('#' + galleryId);

			// 同一ギャラリー内の全画像情報を収集
			var items = [];
			var clickedIndex = 0;

			$gallery.find('.amg-link').each(function (i) {
				var $el = $(this);
				items.push({
					lightbox: $el.attr('href'),
					full: $el.data('full'),
					alt: $el.attr('title') || ''
				});

				if ($el[0] === $link[0]) {
					clickedIndex = i;
				}
			});

			LB.open(items, clickedIndex);
		});
	});
})(jQuery);
