# Architecture Decision Records

ADRは重要な技術判断の背景、決定、影響を記録する。状態は`Proposed`、`Accepted`、`Deprecated`、`Superseded`のいずれかとする。

Accepted ADRの判断を変更するときは既存ファイルを直接改変せず、新しい連番ADRを追加し、旧ADRの状態と置換先を更新する。誤字やリンク切れなど、判断を変えない修正は既存ADRへ直接行ってよい。

ファイル名は`ADR-NNN-short-title.md`とし、3桁の連番を使う。

```markdown
# ADR-NNN: タイトル

- 状態: Proposed
- 決定日: YYYY-MM-DD

## コンテキスト

## 決定

## 影響
```
