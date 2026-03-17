/**
 * Activity Mosaic Gallery - フロントエンドスクリプト
 *
 * 行ベースの Justified Layout エンジン + jQuery ベースの軽量ライトボックス
 *
 * Justified Layout:
 *   各行がコンテナ幅いっぱいに画像で埋まるように配置する。
 *   Flickr / Google Photos と同じアプローチで、
 *   行ごとに画像の幅を比率に応じて按分し、行の高さを揃える。
 *   列ベース Masonry の「列の高さ差による大きな空白」問題を根本的に解消。
 */
(function ($) {
	'use strict';

	/* =============================
	 * Justified Layout エンジン
	 * ============================= */

	var Justified = {

		/**
		 * ギャラリーをレイアウト
		 *
		 * アルゴリズム:
		 * 1. 目標行高さ (targetHeight) を設定
		 * 2. 各画像を目標高さでの幅 (= targetHeight * ratio) に換算
		 * 3. 行に画像を追加していき、合計幅がコンテナ幅を超えたら行を確定
		 * 4. 確定した行は、全画像の幅を按分してコンテナ幅ぴったりに揃える
		 * 5. 最終行は引き伸ばしすぎないよう、目標高さのまま左寄せ
		 *
		 * @param {jQuery} $gallery ギャラリーコンテナ
		 */
		layout: function ($gallery) {
			var gap = parseInt($gallery.data('gap'), 10) || 2;
			var containerWidth = $gallery.width();

			if (containerWidth <= 0) return;

			// 目標行高さ: レスポンシブで調整
			var targetHeight;
			if (containerWidth <= 480) {
				targetHeight = 150;
			} else if (containerWidth <= 768) {
				targetHeight = 180;
			} else {
				targetHeight = 220;
			}

			var $items = $gallery.children('.amg-item');
			var items = [];

			// 各アイテムのアスペクト比を収集
			$items.each(function () {
				var $item = $(this);
				var img = $item.find('img')[0];
				var ratio;

				// 画像が読み込み済みなら実際の比率を使用
				if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
					ratio = img.naturalWidth / img.naturalHeight;
				} else {
					ratio = parseFloat($item.data('ratio')) || 1;
				}

				// ratio が極端な値にならないよう制限
				ratio = Math.max(0.3, Math.min(3.0, ratio));

				items.push({
					$el: $item,
					ratio: ratio
				});
			});

			if (items.length === 0) return;

			// 行を構築
			var rows = [];
			var currentRow = [];
			var currentRowWidth = 0;

			for (var i = 0; i < items.length; i++) {
				var itemWidthAtTarget = targetHeight * items[i].ratio;
				var gapWidthNeeded = currentRow.length > 0 ? gap : 0;

				currentRow.push(items[i]);
				currentRowWidth += itemWidthAtTarget + gapWidthNeeded;

				// 行がコンテナ幅を超えたら確定
				if (currentRowWidth >= containerWidth && currentRow.length > 1) {
					rows.push({ items: currentRow, totalRatio: this._sumRatios(currentRow) });
					currentRow = [];
					currentRowWidth = 0;
				}
			}

			// 最終行
			if (currentRow.length > 0) {
				rows.push({
					items: currentRow,
					totalRatio: this._sumRatios(currentRow),
					isLast: true
				});
			}

			// 各行の画像を配置
			var y = 0;

			for (var r = 0; r < rows.length; r++) {
				var row = rows[r];
				var rowItems = row.items;
				var totalGap = gap * (rowItems.length - 1);
				var availableWidth = containerWidth - totalGap;

				// 行の高さを計算
				// 全画像の ratio の合計で割ることで、行幅にぴったり収まる高さを算出
				var rowHeight;

				if (row.isLast && rows.length > 1) {
					// 最終行: 引き伸ばしすぎないよう、目標高さを上限とする
					var naturalHeight = availableWidth / row.totalRatio;
					rowHeight = Math.min(naturalHeight, targetHeight);
				} else {
					// 通常行: コンテナ幅ぴったりに按分
					rowHeight = availableWidth / row.totalRatio;
				}

				var x = 0;

				for (var c = 0; c < rowItems.length; c++) {
					var item = rowItems[c];
					var itemWidth = Math.round(rowHeight * item.ratio);

					// 最後のアイテムは端数を吸収してコンテナ幅ぴったりに
					if (c === rowItems.length - 1 && !row.isLast) {
						itemWidth = containerWidth - x;
					}

					item.$el.css({
						position: 'absolute',
						top: y + 'px',
						left: x + 'px',
						width: itemWidth + 'px',
						height: Math.round(rowHeight) + 'px'
					});

					x += itemWidth + gap;
				}

				y += Math.round(rowHeight) + gap;
			}

			// コンテナの高さを設定（最後の gap を引く）
			$gallery.css('height', Math.max(0, y - gap) + 'px');
			$gallery.addClass('amg-laid-out');
		},

		/**
		 * 行内のアスペクト比合計を算出
		 *
		 * @param {Array} rowItems
		 * @return {number}
		 */
		_sumRatios: function (rowItems) {
			var sum = 0;
			for (var i = 0; i < rowItems.length; i++) {
				sum += rowItems[i].ratio;
			}
			return sum;
		},

		/**
		 * 全ギャラリーを再レイアウト
		 */
		relayoutAll: function () {
			$('.amg-gallery').each(function () {
				Justified.layout($(this));
			});
		},

		/**
		 * 初期化: 画像読み込みを監視しつつレイアウト実行
		 */
		init: function () {
			$('.amg-gallery').each(function () {
				var $gallery = $(this);
				var $images = $gallery.find('img');
				var total = $images.length;

				if (total === 0) return;

				// 初回レイアウト（data-ratio ベース）
				Justified.layout($gallery);

				// 各画像の読み込み完了ごとに再レイアウト（プログレッシブ）
				var loaded = 0;
				$images.each(function () {
					var img = this;
					if (img.complete && img.naturalWidth > 0) {
						loaded++;
					} else {
						$(img).on('load error', function () {
							loaded++;
							// 画像が読み込まれるたびに再レイアウト
							Justified.layout($gallery);
						});
					}
				});

				// すでに全画像が読み込み済みの場合、即座に再レイアウト
				if (loaded === total) {
					Justified.layout($gallery);
				}
			});

			// ウィンドウリサイズ時に再レイアウト（デバウンス付き）
			var resizeTimer;
			$(window).on('resize.amgJustified', function () {
				clearTimeout(resizeTimer);
				resizeTimer = setTimeout(function () {
					Justified.relayoutAll();
				}, 150);
			});
		}
	};

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

		build: function () {
			if (this.$overlay) return;

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

			this.$overlay.on('click', function (e) {
				if ($(e.target).hasClass('amg-lightbox-overlay')) {
					self.close();
				}
			});

			$(document).on('keydown.amgLightbox', function (e) {
				if (!self.isOpen) return;
				switch (e.which) {
					case 27: self.close(); break;
					case 37: self.prev(); break;
					case 39: self.next(); break;
				}
			});

			this.$overlay[0].addEventListener('touchstart', function (e) {
				self.touchStartX = e.changedTouches[0].screenX;
				self.touchStartY = e.changedTouches[0].screenY;
			}, { passive: true });

			this.$overlay[0].addEventListener('touchend', function (e) {
				var dx = e.changedTouches[0].screenX - self.touchStartX;
				var dy = e.changedTouches[0].screenY - self.touchStartY;
				if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
					if (dx < 0) { self.next(); } else { self.prev(); }
				}
			}, { passive: true });
		},

		open: function (items, index) {
			this.build();
			this.items = items;
			this.current = index;
			this.show(index);

			this.$overlay.css('display', 'flex');
			var $overlay = this.$overlay;
			setTimeout(function () { $overlay.addClass('amg-active'); }, 10);

			this.isOpen = true;
			$('body').css('overflow', 'hidden');
		},

		close: function () {
			var self = this;
			this.$overlay.removeClass('amg-active');
			setTimeout(function () { self.$overlay.css('display', 'none'); }, 250);
			this.isOpen = false;
			$('body').css('overflow', '');
		},

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
			this.$overlay.find('.amg-lb-prev').toggle(index > 0);
			this.$overlay.find('.amg-lb-next').toggle(index < this.items.length - 1);
		},

		prev: function () {
			if (this.current > 0) this.show(this.current - 1);
		},

		next: function () {
			if (this.current < this.items.length - 1) this.show(this.current + 1);
		}
	};

	/* =============================
	 * 初期化
	 * ============================= */

	$(function () {
		Justified.init();

		$(document).on('click', '.amg-link', function (e) {
			e.preventDefault();

			var $link = $(this);
			var galleryId = $link.data('gallery');
			var $gallery = $('#' + galleryId);

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
