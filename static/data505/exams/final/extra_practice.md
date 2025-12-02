# DATA 505 Final Exam: Extra Practice Problems

These additional multiple choice questions are designed to help you prepare for the Final Exam. They cover topics from the entire semester and follow a similar format to those on the actual exam.

---

## Question 1

What is the result of this code?

```r
x <- c(5, 10, 15, 20)
x[c(TRUE, FALSE)]
```

A. `5 10 15 20`  
B. `5 15`  
C. `10 20`  
D. `TRUE FALSE`  

**Answer:** B (recycling: TRUE, FALSE, TRUE, FALSE selects 1st and 3rd elements)

---

## Question 2

Which function would you use to convert a character vector to a factor?

A. `as.factor()`  
B. `to.factor()`  
C. `make.factor()`  
D. `factor.convert()`  

**Answer:** A

---

## Question 3

You have a data frame `df` with columns `name`, `age`, and `score`. Which command extracts the `age` column as a vector?

A. `df[age]`  
B. `df$age`  
C. `df(age)`  
D. `df@age`  

**Answer:** B

---

## Question 4

The IQR (interquartile range) is calculated as:
A. Maximum - Minimum  
B. Q3 - Q1  
C. Mean - Median  
D. Standard deviation squared  

**Answer:** B

---

## Question 5

Which measure of center is most resistant to outliers?
A. Mean  
B. Median  
C. Mode  
D. Variance  

**Answer:** B

---

## Question 6

In hypothesis testing, the null hypothesis (H₀) typically represents:

A. The research hypothesis we want to prove  
B. The status quo or no effect  
C. The alternative explanation  
D. The probability of making an error  

**Answer:** B

---

## Question 7

A p-value of 0.12 with α = 0.05 means:

A. We reject the null hypothesis  
B. We fail to reject the null hypothesis  
C. The null hypothesis is true  
D. The alternative hypothesis is false  

**Answer:** B

---

## Question 8

A 95% confidence interval for a population mean is (45, 55). The correct interpretation is:

A. There is a 95% probability that the true mean is between 45 and 55  
B. 95% of the data falls between 45 and 55  
C. We are 95% confident that the interval (45, 55) contains the true mean  
D. The sample mean is definitely between 45 and 55  

**Answer:** C

---

## Question 9

Which R function performs a one-sample t-test to test if the mean of `x` equals 100?

A. `t.test(x, mean = 100)`  
B. `t.test(x, mu = 100)`  
C. `t.test(x == 100)`  
D. `mean.test(x, 100)`  

**Answer:** B

---

## Question 10

To compare the proportions of success between two groups, you would use:

A. `t.test()`  
B. `prop.test()`  
C. `chisq.test()`  
D. `lm()`  

**Answer:** B

---

## Question 11

In a regression model, a residual is:

A. The predicted value minus the actual value  
B. The actual value minus the predicted value  
C. The slope coefficient  
D. The R-squared value  

**Answer:** B

---

## Question 12

The R-squared value in a regression model ranges from:
A. -1 to 1  
B. 0 to 100  
C. 0 to 1  
D. Any positive number  

**Answer:** C

---

## Question 13

Which of the following R formulas fits a multiple regression with two predictors?
A. `lm(y ~ x1 + x2, data = df)`  
B. `lm(y ~ x1, x2, data = df)`  
C. `lm(y = x1 + x2, data = df)`  
D. `lm(y | x1 + x2, data = df)`  

**Answer:** A

---

## Question 14

When making predictions from a regression model, which interval is wider?
A. Confidence interval  
B. Prediction interval  
C. They are always the same width  
D. It depends on the sample size only  

**Answer:** B (prediction intervals account for both estimation uncertainty and individual variation)

---

## Question 15

The F-test in `anova()` when comparing nested models tests whether:
A. The models have the same intercept  
B. The additional predictors significantly improve the fit  
C. The residuals are normally distributed  
D. The slope equals zero  

**Answer:** B

---

## Question 16

In R, what does this function return if no explicit `return()` statement is used?
```r
my_func <- function(a, b) {
  result <- a + b
  result * 2
}
```

A. Nothing  
B. `result`  
C. `result * 2` (the last expression evaluated)  
D. An error  

**Answer:** C

---

## Question 17

What is the purpose of default argument values in a function?
A. To make the function run faster  
B. To allow the function to be called without specifying those arguments  
C. To prevent errors  
D. To document the function  

**Answer:** B

---

## Question 18

Which of the following correctly defines a function that squares a number?
A. `square <- function(x) { x^2 }`  
B. `function square(x) { x^2 }`  
C. `square(x) <- function { x^2 }`  
D. `def square(x): x^2`  

**Answer:** A

---

## Question 19

In logistic regression, the response variable must be:
A. Continuous and normally distributed  
B. Binary (two categories)  
C. Always positive  
D. A factor with at least 3 levels  

**Answer:** B

---

## Question 20

Which function fits a logistic regression model in R?
A. `lm()`  
B. `logit()`  
C. `glm()` with `family = binomial`  
D. `logistic.regression()`  

**Answer:** C

---

## Question 21

Which of the following creates a sequence from 1 to 10 by 2?
A. `seq(1, 10, 2)`  
B. `sequence(1:10:2)`  
C. `1:10:2`  
D. `rep(1:10, by = 2)`  

**Answer:** A

---

## Question 22

To subset a data frame `df` to rows where column `age` is greater than 25, you would use:
A. `df[df$age > 25]`  
B. `df[age > 25, ]`  
C. `df[df$age > 25, ]`  
D. `subset(age > 25)`  

**Answer:** C

---

## Question 23

In a two-sample t-test using `t.test(y ~ group, data = df)`, what does the tilde (`~`) represent?
A. Division  
B. "y as a function of group" (formula notation)  
C. Multiplication  
D. Exponentiation  

**Answer:** B

---

## Question 24

Which diagnostic plot helps assess whether residuals are normally distributed?
A. Residuals vs Fitted  
B. Q-Q plot  
C. Scale-Location  
D. Residuals vs Leverage  

**Answer:** B

---

## Question 25

What does a high leverage point indicate in regression?

A. A point with a large residual  
B. A point with an unusual predictor value  
C. A point that follows the trend  
D. A point with low influence  

**Answer:** B

---

## Question 26

When would you use `predict(model, interval = "prediction")` instead of `interval = "confidence"`?

A. When predicting the mean response for a given X  
B. When predicting a single new observation  
C. When testing hypothesis about coefficients  
D. When checking model assumptions  

**Answer:** B

---

