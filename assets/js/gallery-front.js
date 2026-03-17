/**
 * Activity Mosaic Gallery - フロントエンドスクリプト
 *
 * 行ベースの Justified Layout エンジン + jQuery ベースの軽量ライトボックス
 * ズーム機能付き（画像クリックで拡大、マウス/タッチで移動）
 */
(function ($) {
	'use strict';

	/* =============================
	 * Justified Layout エンジン
	 * ============================= */

	var Justified = {

		layout: function ($gallery) {
			var gap = parseInt($gallery.data('gap'), 10) || 2;
			var containerWidth = $gallery.width();

			if (containerWidth <= 0) return;

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

			$items.each(function () {
				var $item = $(this);
				var img = $item.find('img')[0];
				var ratio;

				if (img && img.naturalWidth > 0 && img.naturalHeight > 0) {
					ratio = img.naturalWidth / img.naturalHeight;
				} else {
					ratio = parseFloat($item.data('ratio')) || 1;
				}

				ratio = Math.max(0.3, Math.min(3.0, ratio));

				items.push({
					$el: $item,
					ratio: ratio
				});
			});

			if (items.length === 0) return;

			var rows = [];
			var currentRow = [];
			var currentRowWidth = 0;

			for (var i = 0; i < items.length; i++) {
				var itemWidthAtTarget = targetHeight * items[i].ratio;
				var gapWidthNeeded = currentRow.length > 0 ? gap : 0;

				currentRow.push(items[i]);
				currentRowWidth += itemWidthAtTarget + gapWidthNeeded;

				if (currentRowWidth >= containerWidth && currentRow.length > 1) {
					rows.push({ items: currentRow, totalRatio: this._sumRatios(currentRow) });
					currentRow = [];
					currentRowWidth = 0;
				}
			}

			if (currentRow.length > 0) {
				rows.push({
					items: currentRow,
					totalRatio: this._sumRatios(currentRow),
					isLast: true
				});
			}

			var y = 0;

			for (var r = 0; r < rows.length; r++) {
				var row = rows[r];
				var rowItems = row.items;
				var totalGap = gap * (rowItems.length - 1);
				var availableWidth = containerWidth - totalGap;

				var rowHeight;

				if (row.isLast && rows.length > 1) {
					var naturalHeight = availableWidth / row.totalRatio;
					rowHeight = Math.min(naturalHeight, targetHeight);
				} else {
					rowHeight = availableWidth / row.totalRatio;
				}

				var x = 0;

				for (var c = 0; c < rowItems.length; c++) {
					var item = rowItems[c];
					var itemWidth = Math.round(rowHeight * item.ratio);

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

			$gallery.css('height', Math.max(0, y - gap) + 'px');
			$gallery.addClass('amg-laid-out');
		},

		_sumRatios: function (rowItems) {
			var sum = 0;
			for (var i = 0; i < rowItems.length; i++) {
				sum += rowItems[i].ratio;
			}
			return sum;
		},

		relayoutAll: function () {
			$('.amg-gallery').each(function () {
				Justified.layout($(this));
			});
		},

		init: function () {
			$('.amg-gallery').each(function () {
				var $gallery = $(this);
				var $images = $gallery.find('img');
				var total = $images.length;

				if (total === 0) return;

				Justified.layout($gallery);

				var loaded = 0;
				$images.each(function () {
					var img = this;
					if (img.complete && img.naturalWidth > 0) {
						loaded++;
					} else {
						$(img).on('load error', function () {
							loaded++;
							Justified.layout($gallery);
						});
					}
				});

				if (loaded === total) {
					Justified.layout($gallery);
				}

				setTimeout(function () { Justified.layout($gallery); }, 500);
				setTimeout(function () { Justified.layout($gallery); }, 2000);
			});

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
	 * ライトボックス（ズーム機能付き）
	 * ============================= */

	var LB = {
		$overlay: null,
		$content: null,
		$img: null,
		$counter: null,
		$download: null,
		$zoomBtn: null,
		items: [],
		current: 0,
		isOpen: false,
		isZoomed: false,
		touchStartX: 0,
		touchStartY: 0,

		// ズーム用のパン状態
		panX: 0,
		panY: 0,
		isDragging: false,
		dragStartX: 0,
		dragStartY: 0,
		dragStartPanX: 0,
		dragStartPanY: 0,

		build: function () {
			if (this.$overlay) return;

			var downloadIcon =
				'<svg class="amg-lb-download-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
				'<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>' +
				'<polyline points="7 10 12 15 17 10"/>' +
				'<line x1="12" y1="15" x2="12" y2="3"/>' +
				'</svg>';

			// ズームアイコン（虫眼鏡 +）
			var zoomInIcon =
				'<svg class="amg-lb-zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
				'<circle cx="11" cy="11" r="8"/>' +
				'<line x1="21" y1="21" x2="16.65" y2="16.65"/>' +
				'<line x1="11" y1="8" x2="11" y2="14"/>' +
				'<line x1="8" y1="11" x2="14" y2="11"/>' +
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
						'<button class="amg-lb-btn amg-lb-zoom" aria-label="' + amgFront.zoom + '">' +
							zoomInIcon +
						'</button>' +
						'<a class="amg-lb-download" href="#" download>' +
							downloadIcon +
							'<span>' + amgFront.download + '</span>' +
						'</a>' +
					'</div>' +
				'</div>';

			this.$overlay = $(html).appendTo('body');
			this.$content = this.$overlay.find('.amg-lightbox-content');
			this.$img = this.$content.find('img');
			this.$counter = this.$overlay.find('.amg-lb-counter');
			this.$download = this.$overlay.find('.amg-lb-download');
			this.$zoomBtn = this.$overlay.find('.amg-lb-zoom');

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

			// ズームボタン
			this.$overlay.on('click', '.amg-lb-zoom', function (e) {
				e.stopPropagation();
				self.toggleZoom();
			});

			// 画像クリックでズームトグル
			this.$content.on('click', 'img', function (e) {
				e.stopPropagation();
				self.toggleZoom(e);
			});

			// オーバーレイクリックで閉じる
			this.$overlay.on('click', function (e) {
				if ($(e.target).hasClass('amg-lightbox-overlay')) {
					if (self.isZoomed) {
						self.zoomOut();
					} else {
						self.close();
					}
				}
			});

			// ズーム中のマウス移動でパン
			this.$content.on('mousedown', function (e) {
				if (!self.isZoomed) return;
				e.preventDefault();
				self.isDragging = true;
				self.dragStartX = e.clientX;
				self.dragStartY = e.clientY;
				self.dragStartPanX = self.panX;
				self.dragStartPanY = self.panY;
				self.$content.addClass('amg-grabbing');
			});

			$(document).on('mousemove.amgZoom', function (e) {
				if (!self.isDragging) return;
				self.panX = self.dragStartPanX + (e.clientX - self.dragStartX);
				self.panY = self.dragStartPanY + (e.clientY - self.dragStartY);
				self._applyTransform();
			});

			$(document).on('mouseup.amgZoom', function () {
				if (self.isDragging) {
					self.isDragging = false;
					self.$content.removeClass('amg-grabbing');
				}
			});

			// ズーム中のタッチ移動でパン
			this.$content[0].addEventListener('touchstart', function (e) {
				if (!self.isZoomed) {
					self.touchStartX = e.changedTouches[0].screenX;
					self.touchStartY = e.changedTouches[0].screenY;
					return;
				}
				if (e.touches.length === 1) {
					self.isDragging = true;
					self.dragStartX = e.touches[0].clientX;
					self.dragStartY = e.touches[0].clientY;
					self.dragStartPanX = self.panX;
					self.dragStartPanY = self.panY;
				}
			}, { passive: true });

			this.$content[0].addEventListener('touchmove', function (e) {
				if (!self.isZoomed || !self.isDragging) return;
				e.preventDefault();
				self.panX = self.dragStartPanX + (e.touches[0].clientX - self.dragStartX);
				self.panY = self.dragStartPanY + (e.touches[0].clientY - self.dragStartY);
				self._applyTransform();
			}, { passive: false });

			this.$content[0].addEventListener('touchend', function (e) {
				if (self.isZoomed) {
					self.isDragging = false;
					return;
				}
				// ズーム中でない場合はスワイプ判定
				var dx = e.changedTouches[0].screenX - self.touchStartX;
				var dy = e.changedTouches[0].screenY - self.touchStartY;
				if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
					if (dx < 0) { self.next(); } else { self.prev(); }
				}
			}, { passive: true });

			// オーバーレイでのスワイプ（コンテンツ外）
			this.$overlay[0].addEventListener('touchstart', function (e) {
				if ($(e.target).hasClass('amg-lightbox-overlay')) {
					self.touchStartX = e.changedTouches[0].screenX;
					self.touchStartY = e.changedTouches[0].screenY;
				}
			}, { passive: true });

			this.$overlay[0].addEventListener('touchend', function (e) {
				if (!$(e.target).hasClass('amg-lightbox-overlay')) return;
				var dx = e.changedTouches[0].screenX - self.touchStartX;
				var dy = e.changedTouches[0].screenY - self.touchStartY;
				if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
					if (dx < 0) { self.next(); } else { self.prev(); }
				}
			}, { passive: true });

			// キーボード操作
			$(document).on('keydown.amgLightbox', function (e) {
				if (!self.isOpen) return;
				switch (e.which) {
					case 27: // Escape
						if (self.isZoomed) { self.zoomOut(); } else { self.close(); }
						break;
					case 37: if (!self.isZoomed) self.prev(); break;
					case 39: if (!self.isZoomed) self.next(); break;
				}
			});
		},

		/**
		 * ズームトグル
		 */
		toggleZoom: function (e) {
			if (this.isZoomed) {
				this.zoomOut();
			} else {
				this.zoomIn(e);
			}
		},

		/**
		 * ズームイン: 画像を実サイズ表示 + パン可能にする
		 */
		zoomIn: function (e) {
			this.isZoomed = true;
			this.$overlay.addClass('amg-zoomed');

			// クリック位置を中心にズーム
			if (e && e.clientX) {
				var rect = this.$img[0].getBoundingClientRect();
				var clickXRatio = (e.clientX - rect.left) / rect.width;
				var clickYRatio = (e.clientY - rect.top) / rect.height;

				var img = this.$img[0];
				var natW = img.naturalWidth || img.width;
				var natH = img.naturalHeight || img.height;

				// 画面中央を基準に、クリック箇所がそこに来るようオフセット
				var viewW = window.innerWidth;
				var viewH = window.innerHeight;
				this.panX = (viewW / 2) - (natW * clickXRatio);
				this.panY = (viewH / 2) - (natH * clickYRatio);
			} else {
				this.panX = 0;
				this.panY = 0;
			}

			this._applyTransform();
		},

		/**
		 * ズームアウト: 通常表示に戻す
		 */
		zoomOut: function () {
			this.isZoomed = false;
			this.isDragging = false;
			this.panX = 0;
			this.panY = 0;
			this.$overlay.removeClass('amg-zoomed');
			this.$content.removeClass('amg-grabbing');
			this.$img.css('transform', '');
			this.$content.css('transform', '');
		},

		/**
		 * パン位置を適用
		 */
		_applyTransform: function () {
			this.$content.css({
				transform: 'translate(' + this.panX + 'px, ' + this.panY + 'px)'
			});
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
			if (this.isZoomed) this.zoomOut();
			var self = this;
			this.$overlay.removeClass('amg-active');
			setTimeout(function () { self.$overlay.css('display', 'none'); }, 250);
			this.isOpen = false;
			$('body').css('overflow', '');
		},

		show: function (index) {
			// ズームを解除してから画像を切り替え
			if (this.isZoomed) this.zoomOut();

			var item = this.items[index];
			// フルサイズ画像を表示（large ではなく full を使用）
			this.$img.attr('src', item.full).attr('alt', item.alt);
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
