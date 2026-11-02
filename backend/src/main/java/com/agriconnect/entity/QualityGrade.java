package com.agriconnect.entity;

/**
 * Quality grade categories determined server-side from calculated quality scores:
 * Grade A: Score 80.00 - 100.00 (Premium export/retail quality)
 * Grade B: Score 60.00 - 79.99 (Standard market/processing quality)
 * Grade C: Score 0.00 - 59.99 (Economy/discount quality)
 */
public enum QualityGrade {
    A(3),
    B(2),
    C(1);

    private final int rank;

    QualityGrade(int rank) {
        this.rank = rank;
    }

    public int getRank() {
        return rank;
    }

    /**
     * Checks if this quality grade satisfies or exceeds the required minimum grade.
     * E.g. A satisfies A, B, C; B satisfies B, C; C satisfies C only.
     */
    public boolean satisfiesMinimum(QualityGrade minimumRequired) {
        if (minimumRequired == null) {
            return true;
        }
        return this.rank >= minimumRequired.rank;
    }

    /**
     * Returns the list of acceptable quality grades for a given minimum grade requirement.
     * Req Grade A -> accepts [A]
     * Req Grade B -> accepts [A, B]
     * Req Grade C -> accepts [A, B, C]
     */
    public static java.util.List<QualityGrade> getAcceptableGrades(QualityGrade minimumRequired) {
        if (minimumRequired == null) {
            return java.util.List.of(values());
        }
        return switch (minimumRequired) {
            case A -> java.util.List.of(A);
            case B -> java.util.List.of(A, B);
            case C -> java.util.List.of(A, B, C);
        };
    }
}
