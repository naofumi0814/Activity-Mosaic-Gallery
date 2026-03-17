=== Activity Mosaic Gallery ===
Contributors: activity-mosaic-gallery
Tags: gallery, lightbox, classic-editor, masonry, kindergarten
Requires at least: 5.0
Tested up to: 6.7
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Classic Editor 用の軽量ギャラリープラグイン。Masonry 風レイアウトと軽量ライトボックス（ダウンロード機能付き）を搭載。幼稚園・保育園の活動報告に最適。

== Description ==

Activity Mosaic Gallery は、WordPress の Classic Editor から直接画像を選んでギャラリーを挿入できる軽量プラグインです。

**特徴:**

* Classic Editor のツールバーに専用ボタンを追加
* WordPress 標準のメディアライブラリで複数画像を選択
* ショートコードを自動挿入
* CSS Columns ベースの Masonry 風レイアウト（画像の縦横比を保持）
* jQuery ベースの軽量ライトボックス
* ライトボックス内のダウンロードボタン（保護者が画像を保存可能）
* キーボード操作（左右矢印・Escape）
* スマートフォンのスワイプ操作
* ギャラリーがあるページでのみ CSS / JS を読み込み
* 専用の管理画面不要・軽量設計

**想定用途:**

* 幼稚園・保育園の活動報告ページ
* 学校行事の写真公開
* イベントレポート

== Installation ==

1. プラグインフォルダを `/wp-content/plugins/activity-mosaic-gallery/` にアップロード
2. WordPress 管理画面の「プラグイン」から有効化
3. Classic Editor がインストール・有効化されていることを確認

== Usage ==

1. 投稿の編集画面を開く
2. エディタ上部の「活動ギャラリー挿入」ボタンをクリック
3. メディアライブラリから画像を複数選択
4. 「ギャラリーに挿入」をクリック
5. ショートコードが自動挿入される

**ショートコード例:**

`[activity_gallery ids="123,456,789"]`

**オプション属性:**

* `columns` - 列数（2〜6、デフォルト: 4）
* `gap` - 画像間の余白（0〜8px、デフォルト: 2）
* `size` - サムネイルサイズ（デフォルト: medium_large）

**属性付きの例:**

`[activity_gallery ids="123,456,789" columns="3" gap="4" size="medium"]`

== Frequently Asked Questions ==

= ブロックエディター（Gutenberg）で使えますか？ =

このプラグインは Classic Editor 専用に設計されています。Classic Editor プラグインを有効化してご利用ください。

= 画像の並び順は変更できますか？ =

ids 属性の順番がそのまま表示順になります。順番を変えたい場合は、ショートコード内の数字の並びを変更してください。

== Changelog ==

= 1.0.0 =
* 初回リリース
* Classic Editor 用ギャラリー挿入ボタン
* Masonry 風レイアウト
* jQuery 軽量ライトボックス（ダウンロード機能付き）
* レスポンシブ対応
* キーボード操作・スワイプ対応
