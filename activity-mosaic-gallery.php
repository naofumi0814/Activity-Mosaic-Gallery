<?php
/**
 * Plugin Name: Activity Mosaic Gallery
 * Plugin URI:  https://github.com/naofumi0814/Activity-Mosaic-Gallery
 * Description: Classic Editor 用の軽量ギャラリープラグイン。投稿画面から直接画像を選択し、Masonry 風の密なレイアウトで表示。jQuery ベースの軽量ライトボックス（ダウンロード機能付き）を搭載。幼稚園・保育園の活動報告向け。
 * Version:     1.0.0
 * Author:      Activity Mosaic Gallery
 * License:     GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: activity-mosaic-gallery
 * Requires at least: 5.0
 * Requires PHP: 7.4
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'AMG_VERSION', '1.2.0' );
define( 'AMG_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'AMG_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

require_once AMG_PLUGIN_DIR . 'includes/class-shortcode.php';

/**
 * メインプラグインクラス
 */
final class Activity_Mosaic_Gallery {

	/**
	 * シングルトンインスタンス
	 *
	 * @var self|null
	 */
	private static $instance = null;

	/**
	 * ショートコードが検出されたかどうか
	 *
	 * @var bool
	 */
	private $has_gallery = false;

	/**
	 * シングルトン取得
	 *
	 * @return self
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * コンストラクタ
	 */
	private function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'register_front_assets' ) );
		add_action( 'wp_footer', array( $this, 'maybe_enqueue_front_assets' ) );

		// wpautop がショートコード出力の <div> を <p> で囲むのを防止
		add_filter( 'the_content', array( $this, 'fix_shortcode_wpautop' ), 8 );

		AMG_Shortcode::init();
	}

	/**
	 * 管理画面アセット読み込み（投稿編集画面のみ）
	 *
	 * @param string $hook_suffix 現在の管理画面ページ
	 */
	public function enqueue_admin_assets( $hook_suffix ) {
		if ( ! in_array( $hook_suffix, array( 'post.php', 'post-new.php' ), true ) ) {
			return;
		}

		wp_enqueue_media();

		wp_enqueue_style(
			'amg-admin',
			AMG_PLUGIN_URL . 'assets/css/gallery-admin.css',
			array(),
			AMG_VERSION
		);

		wp_enqueue_script(
			'amg-admin',
			AMG_PLUGIN_URL . 'assets/js/gallery-admin.js',
			array( 'jquery' ),
			AMG_VERSION,
			true
		);

		wp_localize_script( 'amg-admin', 'amgAdmin', array(
			'title'      => __( '活動ギャラリーの画像を選択', 'activity-mosaic-gallery' ),
			'buttonText' => __( 'ギャラリーに挿入', 'activity-mosaic-gallery' ),
		) );
	}

	/**
	 * フロントアセットを登録（まだ enqueue しない）
	 */
	public function register_front_assets() {
		wp_register_style(
			'amg-front',
			AMG_PLUGIN_URL . 'assets/css/gallery-front.css',
			array(),
			AMG_VERSION
		);

		wp_register_script(
			'amg-front',
			AMG_PLUGIN_URL . 'assets/js/gallery-front.js',
			array( 'jquery' ),
			AMG_VERSION,
			true
		);

		wp_localize_script( 'amg-front', 'amgFront', array(
			'prev'     => __( '前へ', 'activity-mosaic-gallery' ),
			'next'     => __( '次へ', 'activity-mosaic-gallery' ),
			'close'    => __( '閉じる', 'activity-mosaic-gallery' ),
			'download' => __( 'ダウンロード', 'activity-mosaic-gallery' ),
			'counter'  => __( '%current% / %total%', 'activity-mosaic-gallery' ),
		) );
	}

	/**
	 * ギャラリー検出フラグを立てる（ショートコードから呼ばれる）
	 */
	public function set_has_gallery() {
		$this->has_gallery = true;
	}

	/**
	 * wpautop がショートコード出力を <p> で囲むのを防止
	 *
	 * WordPress の wpautop フィルターは priority 10 で動作するため、
	 * priority 8 でショートコード前後の余計な改行を除去し、
	 * <p><div> のような不正な入れ子を防ぐ。
	 *
	 * @param string $content 投稿本文
	 * @return string 修正済み本文
	 */
	public function fix_shortcode_wpautop( $content ) {
		// ショートコード前後の改行・空白を除去して wpautop の <p> 囲みを防止
		$content = preg_replace( '/\s*(\[activity_gallery\s)/', "\n\n$1", $content );
		$content = preg_replace( '/(\[activity_gallery[^\]]*\])\s*/', "$1\n\n", $content );
		return $content;
	}

	/**
	 * ギャラリーが存在する場合のみフロントアセットを enqueue
	 */
	public function maybe_enqueue_front_assets() {
		if ( $this->has_gallery ) {
			wp_enqueue_style( 'amg-front' );
			wp_enqueue_script( 'amg-front' );
		}
	}
}

Activity_Mosaic_Gallery::get_instance();
