# Fichiers CSV de test — import participants

**Format** : `Course;Catégorie;Équipe;Nom;Prénom;Mail;Tel;Capitaine`

- **Catégorie** obligatoire : `Solo`, `Loisir`, `Compétition` (alias acceptés, insensibles aux accents), ou tout autre libellé (ex. `Handisport`) enregistré comme catégorie personnalisée.
- **Équipe** vide → création automatique de `Solo <prénom> <nom>`.
- Même nom de course possible si la catégorie diffère (ex. « Vélo » en Solo et en Compétition).

| Fichier | Usage |
|---------|--------|
| `import-participants-test.csv` | Édition **2026** après seed |
| `import-participants-test-edition-vide.csv` | Édition vide |
| `import-participants-test-headers-permutes.csv` | Colonnes permutées |

Lignes 7–8 du fichier principal : participants **solo** (équipe vide).
