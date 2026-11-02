package com.agriconnect;

import com.agriconnect.entity.QualityGrade;
import com.agriconnect.exception.BadRequestException;
import com.agriconnect.service.QualityAssessmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Unit tests verifying quality score calculation formulas, grade determinations,
 * boundary conditions, and parameter scale validation.
 */
class QualityAssessmentCalculationTest {

    @Test
    @DisplayName("Should correctly calculate Grade A score for 10, 9, 9, 10, 9 (Avg: 9.4 -> Score: 94.00, Grade A)")
    void testGradeAExample() {
        BigDecimal score = QualityAssessmentService.calculateQualityScore(10, 9, 9, 10, 9);
        QualityGrade grade = QualityAssessmentService.determineQualityGrade(score);

        assertThat(score).isEqualByComparingTo(new BigDecimal("94.00"));
        assertThat(grade).isEqualTo(QualityGrade.A);
    }

    @Test
    @DisplayName("Should correctly calculate Grade B score for 7, 7, 6, 7, 6 (Avg: 6.6 -> Score: 66.00, Grade B)")
    void testGradeBExample() {
        BigDecimal score = QualityAssessmentService.calculateQualityScore(7, 7, 6, 7, 6);
        QualityGrade grade = QualityAssessmentService.determineQualityGrade(score);

        assertThat(score).isEqualByComparingTo(new BigDecimal("66.00"));
        assertThat(grade).isEqualTo(QualityGrade.B);
    }

    @Test
    @DisplayName("Should correctly calculate Grade C score for 4, 5, 4, 5, 4 (Avg: 4.4 -> Score: 44.00, Grade C)")
    void testGradeCExample() {
        BigDecimal score = QualityAssessmentService.calculateQualityScore(4, 5, 4, 5, 4);
        QualityGrade grade = QualityAssessmentService.determineQualityGrade(score);

        assertThat(score).isEqualByComparingTo(new BigDecimal("44.00"));
        assertThat(grade).isEqualTo(QualityGrade.C);
    }

    @Test
    @DisplayName("Should correctly calculate score for example in prompt (9, 8, 9, 8, 9 -> Avg: 8.6 -> Score: 86.00, Grade A)")
    void testPromptExample() {
        BigDecimal score = QualityAssessmentService.calculateQualityScore(9, 8, 9, 8, 9);
        QualityGrade grade = QualityAssessmentService.determineQualityGrade(score);

        assertThat(score).isEqualByComparingTo(new BigDecimal("86.00"));
        assertThat(grade).isEqualTo(QualityGrade.A);
    }

    @ParameterizedTest(name = "Score {0} must map to Grade {1}")
    @CsvSource({
            "100.00, A",
            "95.50, A",
            "80.00, A",
            "79.99, B",
            "79.00, B",
            "60.00, B",
            "59.99, C",
            "59.00, C",
            "45.00, C",
            "0.00, C"
    })
    @DisplayName("Should verify exact grade boundary transitions")
    void testGradeBoundaries(String scoreStr, String expectedGradeStr) {
        BigDecimal score = new BigDecimal(scoreStr);
        QualityGrade grade = QualityAssessmentService.determineQualityGrade(score);
        assertThat(grade).isEqualTo(QualityGrade.valueOf(expectedGradeStr));
    }

    @Test
    @DisplayName("Should throw BadRequestException when freshness is out of 1-10 range")
    void testInvalidFreshness() {
        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(0, 8, 8, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Freshness rating must be between 1 and 10");

        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(11, 8, 8, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Freshness rating must be between 1 and 10");
    }

    @Test
    @DisplayName("Should throw BadRequestException when appearance is out of 1-10 range")
    void testInvalidAppearance() {
        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 0, 8, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Appearance rating must be between 1 and 10");

        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 11, 8, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Appearance rating must be between 1 and 10");
    }

    @Test
    @DisplayName("Should throw BadRequestException when size is out of 1-10 range")
    void testInvalidSize() {
        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 0, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Size rating must be between 1 and 10");

        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 12, 8, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Size rating must be between 1 and 10");
    }

    @Test
    @DisplayName("Should throw BadRequestException when color is out of 1-10 range")
    void testInvalidColor() {
        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 8, -1, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Color rating must be between 1 and 10");

        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 8, 15, 8))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Color rating must be between 1 and 10");
    }

    @Test
    @DisplayName("Should throw BadRequestException when ripeness is out of 1-10 range")
    void testInvalidRipeness() {
        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 8, 8, 0))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ripeness rating must be between 1 and 10");

        assertThatThrownBy(() -> QualityAssessmentService.calculateQualityScore(8, 8, 8, 8, 11))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Ripeness rating must be between 1 and 10");
    }

    @Test
    @DisplayName("Should throw BadRequestException when quality score is outside 0-100")
    void testInvalidQualityScore() {
        assertThatThrownBy(() -> QualityAssessmentService.determineQualityGrade(new BigDecimal("-0.01")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quality score must be between 0 and 100");

        assertThatThrownBy(() -> QualityAssessmentService.determineQualityGrade(new BigDecimal("100.01")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quality score must be between 0 and 100");

        assertThatThrownBy(() -> QualityAssessmentService.determineQualityGrade(null))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Quality score cannot be null");
    }
}
