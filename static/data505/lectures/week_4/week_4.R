## -----------------------------------------------------------------------------
#| include: false

invisible(NULL)
library(dplyr)


## flowchart TD
## A[Unknown Population Parameters<br/>μ, σ, p, etc.] --> B[Probability Model<br/>Normal, Binomial, etc.]
## B --Random sampling mechanism--> D[Observed Sample Data<br/>x₁, x₂, ..., xₙ]
## D --Statistical inference--> A
## 
## style A fill:#ffcccc
## style D fill:#ccffcc

## flowchart TD
##     A[What type of parameter?] --> B[Mean]
##     A --> C[Proportion]
##     A --> D[Categorical Association]
## 
##     B --> E[How many groups?]
##     E --> F[One sample<br/>t.test&#40;x, mu = μ₀&#41;]
##     E --> G[Two samples<br/>t.test&#40;y ~ group&#41;<br/>or<br/>t.test&#40;x1, x2&#41;]
## 
##     C --> H[How many groups?]
##     H --> I[One sample<br/>prop.test&#40;x, n, p = p₀&#41;]
##     H --> J[Two samples<br/>prop.test&#40;c&#40;x1,x2&#41;, c&#40;n1,n2&#41;&#41;]
## 
##     D --> K[Test of independence<br/>chisq.test&#40;table&#40;var1, var2&#41;&#41;]
## 
##     style F fill:#e1f5fe
##     style G fill:#e1f5fe
##     style I fill:#f3e5f5
##     style J fill:#f3e5f5
##     style K fill:#e8f5e8

## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Load the dataset, derive the weight change, and plot
#| echo: true

data(anorexia, package = "MASS")
weight_chg <- anorexia$Postwt - anorexia$Prewt
hist(weight_chg, xlab = "Difference in weight before and after therapy")


## -----------------------------------------------------------------------------
#| echo: true

summary(weight_chg)


## -----------------------------------------------------------------------------
#| echo: true

test_result <- t.test(
  x = weight_chg, # numeric vector of observations
  mu = 0, # value from H0
  alternative = "greater" # what kind of inequality is in HA
)
test_result


## -----------------------------------------------------------------------------
#| echo: true

# do not need "mu" or "alternative" arguments here
# we do need the "level" argument
ci_result <- t.test(x = weight_chg,
                    level = 0.95) 
class(ci_result)
typeof(ci_result)
names(ci_result)
ci_result$conf.int


## flowchart LR
##     A[Eligible Patients<br/>with Epilepsy] --> B[Randomization]
##     B --> C[Treatment Group<br/>Progabide]
##     B --> D[Control Group<br/>Placebo]
##     C --> E[Measure<br/>log Seizure Rate]
##     D --> F[Measure<br/>log Seizure Rate]
##     E --> G[Statistical Comparison<br/>t.test&#40;log.seizure.rate ~ treatment&#41;]
##     F --> G
## 
##     style A fill:#f9f9f9
##     style B fill:#fff2cc
##     style C fill:#e1f5fe
##     style D fill:#ffebee
##     style G fill:#f3e5f5

## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Load and display the epilepsy clinical trial data
#| echo: true

data("epilepsy", package = "HSAUR")
epilepsy <- subset(epilepsy, period == "4")
epilepsy$log.seizure.rate <- log(1 + epilepsy$seizure.rate)
epilepsy$treatment <- relevel(epilepsy$treatment, "Progabide")
str(epilepsy)


## -----------------------------------------------------------------------------
#| echo: true

test_result <- t.test(
  log.seizure.rate ~ treatment,
  data = epilepsy,
  alternative = "less"
)
test_result


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Define and display the poll results

n <- 2516
poll_data <- tribble(
  ~candidate, ~count,
  "Kamala Harris", 1132,
  "Donald Trump", 1157,
  "All other candidates", 227
) 
poll_data$proportion <- scales::percent(poll_data$count / n, 1)

knitr::kable(poll_data)


## -----------------------------------------------------------------------------
ci_result <- prop.test(x = 1132, n = 2516)$conf.int
ci_result


## -----------------------------------------------------------------------------
prop.test(x = 1132, n = 2516, alternative = "less", p = 0.5)


## flowchart LR
##     A[Eligible Patients<br/>with arthritis] --> B[Randomization]
##     B --> C[Treatment]
##     B --> D[Placebo]
##     C --> E[Proportion of patients<br/>showing marked symptom improvement]
##     D --> F[Proportion of patients<br/>showing marked symptom improvement]
##     E --> G[Statistical Comparison<br/>prop.test]
##     F --> G
## 
##     style A fill:#f9f9f9
##     style B fill:#fff2cc
##     style C fill:#e1f5fe
##     style D fill:#ffebee
##     style G fill:#f3e5f5

## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Load the patient-level data

if(!"vcd" %in% installed.packages()) install.packages("vcd")
data("Arthritis", package = "vcd")
str(Arthritis)


## -----------------------------------------------------------------------------
counts <- with(
  Arthritis,
  table(Treatment, Improved == "Marked",
        dnn = list("treatment", "marked_improvement"))
)
counts
prop.table(counts, margin = 1)
class(counts)


## -----------------------------------------------------------------------------
prop.test(
  counts[c("Treated", "Placebo"),
         c("TRUE", "FALSE")],
  alternative = "greater"
)


## -----------------------------------------------------------------------------
ci_result <- prop.test(counts)$conf.int
ci_result


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Load and display the Titanic survival data

data("Titanic", package = "datasets")
str(Titanic)


## -----------------------------------------------------------------------------
class_table <- margin.table(Titanic, c("Class", "Survived"))
class_table


## -----------------------------------------------------------------------------
chisq.test(class_table)


## -----------------------------------------------------------------------------
outcome <- matrix(
  c(3, 1,
    1, 3),
  nrow = 2, ncol = 2,
  byrow = TRUE, dimnames = list(guess = c("tea first", "milk first"),
                                truth = c("tea first", "milk first"))
)
outcome


## -----------------------------------------------------------------------------
fisher.test(outcome, alternative = "greater")

