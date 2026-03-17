<?php
/**
 * ショートコード処理クラス
 *
 * [activity_gallery ids="123,456,789" columns="4" gap="2" size="medium"]
 *
 * @package Activity_Mosaic_Gallery
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * ショートコードの登録と出力を担当するクラス
 */
class AMG_Shortcode {

	/**
	 * ギャラリーごとの連番カウンター
	 *
	 * @var int
	 */
	private static $gallery_index = 0;

	/**
	 * 初期化
	 */
	public static function init() {
		add_shortcode( 'activity_gallery', array( __CLASS__, 'render' ) );
	}

	/**
	 * ショートコードを描画
	 *
	 * @param array|string $atts ショートコード属性
	 * @return string HTML 出力
	 */
	public static function render( $atts ) {
		$atts = shortcode_atts( array(
			'ids'     => '',
			'columns' => '4',
			'gap'     => '2',
			'size'    => 'medium_large',
		), $atts, 'activity_gallery' );

		$ids = self::parse_ids( $atts['ids'] );

		if ( empty( $ids ) ) {
			return '';
		}

		// フロントアセット読み込みフラグを立てる
		Activity_Mosaic_Gallery::get_instance()->set_has_gallery();

		self::$gallery_index++;
		$gallery_id = 'amg-gallery-' . self::$gallery_index;
		$columns    = absint( $atts['columns'] );
		$gap        = absint( $atts['gap'] );
		$size       = sanitize_text_field( $atts['size'] );

		// 列数の範囲を制限
		$columns = max( 2, min( 6, $columns ) );
		// gap の範囲を制限 (0-8px)
		$gap = min( 8, $gap );

		$output = sprintf(
			'<div id="%s" class="amg-gallery" data-columns="%d" data-gap="%d" style="--amg-columns:%d;--amg-gap:%dpx;">',
			esc_attr( $gallery_id ),
			$columns,
			$gap,
			$columns,
			$gap
		);

		foreach ( $ids as $id ) {
			$id = absint( $id );
			if ( ! $id ) {
				continue;
			}

			// サムネイル用画像（一覧表示）
			$thumb_src = wp_get_attachment_image_src( $id, $size );
			// フルサイズ画像（ライトボックス・ダウンロード用）
			$full_src = wp_get_attachment_image_src( $id, 'full' );
			// large サイズ（ライトボックス表示用）
			$large_src = wp_get_attachment_image_src( $id, 'large' );

			if ( ! $thumb_src || ! $full_src ) {
				continue;
			}

			$alt     = get_post_meta( $id, '_wp_attachment_image_alt', true );
			$caption = wp_get_attachment_caption( $id );
			$title   = get_the_title( $id );
			$alt_text = $alt ? $alt : $title;

			// ライトボックス用はlarge、ダウンロード用はfull
			$lightbox_url  = $large_src ? $large_src[0] : $full_src[0];
			$download_url  = $full_src[0];
			$thumb_width   = $thumb_src[1];
			$thumb_height  = $thumb_src[2];

			// アスペクト比を計算してdata属性に付与（JS レイアウト用）
			$ratio = ( $thumb_height > 0 ) ? round( $thumb_width / $thumb_height, 4 ) : 1;

			$output .= sprintf(
				'<figure class="amg-item" data-ratio="%s" style="--amg-ratio:%s;">',
				esc_attr( $ratio ),
				esc_attr( $ratio )
			);

			$output .= sprintf(
				'<a href="%s" class="amg-link" data-full="%s" data-gallery="%s" title="%s">',
				esc_url( $lightbox_url ),
				esc_url( $download_url ),
				esc_attr( $gallery_id ),
				esc_attr( $alt_text )
			);

			$output .= sprintf(
				'<img src="%s" alt="%s" width="%d" height="%d" loading="lazy" decoding="async" />',
				esc_url( $thumb_src[0] ),
				esc_attr( $alt_text ),
				(int) $thumb_width,
				(int) $thumb_height
			);

			$output .= '</a>';

			if ( $caption ) {
				$output .= sprintf(
					'<figcaption class="amg-caption">%s</figcaption>',
					esc_html( $caption )
				);
			}

			$output .= '</figure>';
		}

		$output .= '</div>';

		return $output;
	}

	/**
	 * カンマ区切りの ID 文字列を配列に変換
	 *
	 * @param string $ids_string カンマ区切り ID 文字列
	 * @return int[] 整数 ID の配列
	 */
	private static function parse_ids( $ids_string ) {
		if ( empty( $ids_string ) ) {
			return array();
		}

		$ids = explode( ',', $ids_string );
		$ids = array_map( 'absint', $ids );
		$ids = array_filter( $ids );

		return array_values( $ids );
	}
}
