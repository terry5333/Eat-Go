# Eat-Go
# EatGo（免費版）

不知道吃什麼？你選條件，我給你 5 間。

這個版本完全不用 Google / 不用信用卡 / 不用 API Key。

## 資料來源（免費）
- OpenStreetMap（地圖資料）
- Overpass API（找附近餐廳）
- Nominatim（把「台北 信義」轉成座標）

> 注意：免費資料通常沒有 Google 那種「評分 / 價位 / 即時營業中」。
> 本專案改用「距離 + 是否有 opening_hours」做 vibe 排序。

## 功能
- 定位或手動輸入地點
- 類型 / 距離
-（近似）只看可能營業：用 opening_hours 是否存在做篩選
- 一次列出 5 間
- 再來 5 間
- 收藏（localStorage）

## 開始跑
```bash
npm i
npm run dev
