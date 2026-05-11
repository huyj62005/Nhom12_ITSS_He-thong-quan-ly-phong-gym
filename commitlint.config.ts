export default {
    extends: ["@commitlint/config-conventional"],
    rules: {
        "header-max-length": [2, "always", 100],
        "type-enum": [
            2,
            "always",
            [
                "feat",
                "fix",
                "docs",
                "refactor",
                "style",
                "test",
                "chore",
                "perf",
                "ci",
                "hotfix",
                "revert",
            ],
        ],
        "subject-case": [0],
    },
};
