# ----------------------------------------------------------------------------
# Example analysis of baseball data
# Data 505: Statistics Using R
# December 2025
# ----------------------------------------------------------------------------

# As a final example, this script shows end-to-end data analysis of a 
# baseball dataset, and illustrates some of the concepts we've discussed in 
# the course.

# ----------------------------------------------------------------------------
# Setup
# ----------------------------------------------------------------------------

# Install the Lahman package if needed (comment out after first run)
# install.packages("Lahman")
# install.packages("tidyverse")

# Load packages
library(Lahman)
library(tidyverse)

# ----------------------------------------------------------------------------
# Part 1: Data structures & exploration
# Data types, vectors, data frames, subsetting
# ----------------------------------------------------------------------------

# The Lahman package contains many datasets. Let's explore batting statistics
data("Batting")

# Examine the structure
class(Batting)
str(Batting)
head(Batting)
dim(Batting)

# What types of data do we have?
typeof(Batting$playerID) # character
typeof(Batting$yearID) # integer
typeof(Batting$H) # integer (hits)
typeof(Batting$AB) # integer (at bats)

# Create batting average (a calculated variable)
# Reminder: Batting average = Hits / At Bats
Batting$BA <- Batting$H / Batting$AB

# Check for missing values
sum(is.na(Batting$BA))
# Some players have 0 at bats, creating NaN (not a number)
sum(Batting$AB == 0)

# Subset to players with at least 400 at bats in a season (qualifying batters)
qualified_batting <- Batting |>
  filter(AB >= 400)


# ----------------------------------------------------------------------------
# Part 2: Descriptive statistics
# Review: Measures of center, spread, and describing distributions
# ----------------------------------------------------------------------------

# Modern era: Let's focus on 1995-2023 (post-strike era)
modern_batting <- qualified_batting |>
  filter(yearID >= 1995)

# Measures of center for batting average
mean(modern_batting$BA)
median(modern_batting$BA)

# Measures of spread
sd(modern_batting$BA)
var(modern_batting$BA)
IQR(modern_batting$BA)
range(modern_batting$BA)

# Five number summary
summary(modern_batting$BA)
quantile(modern_batting$BA, probs = c(0.25, 0.5, 0.75))

# Categorical variable: league
table(modern_batting$lgID)
prop.table(table(modern_batting$lgID))

# ----------------------------------------------------------------------------
# Part 3: Data visualization
# ----------------------------------------------------------------------------
# Review: ggplot2, histograms, boxplots, scatterplots

# Histogram of batting averages
ggplot(modern_batting, aes(x = BA)) +
  geom_histogram(bins = 30) +
  labs(title = "Distribution of Batting Averages (1995-2023)",
       subtitle = "Qualified batters (400+ AB)",
       x = "Batting Average",
       y = "Count") +
  theme_minimal()

# Boxplot by league
ggplot(modern_batting, aes(x = lgID, y = BA, fill = lgID)) +
  geom_boxplot() +
  labs(title = "Batting Average by League",
       x = "League",
       y = "Batting Average") +
  theme_minimal()

# Scatter plot: Home runs vs Batting Average
ggplot(modern_batting, aes(x = HR, y = BA)) +
  geom_point(alpha = 0.3) +
  geom_smooth(method = "lm", se = TRUE) +
  labs(title = "Home Runs vs Batting Average",
       x = "Home Runs",
       y = "Batting Average") +
  theme_minimal()

# ----------------------------------------------------------------------------
# Part 4: Statistical inference - one sample
# Review: Hypothesis tests, confidence intervals, p-values
# ----------------------------------------------------------------------------

# Question: Has the mean batting average in recent years (2019-2023)
# been significantly different from the "ideal" .300 mark?

recent_batting <- qualified_batting |>
  filter(yearID >= 2019)

# One-sample t-test
# H0: μ = 0.300
# Ha: μ ≠ 0.300
t.test(recent_batting$BA, mu = 0.300)

# Interpretation:
# - Sample mean is around .260
# - P-value is very small (< 0.05)
# - We reject H0: mean batting average is significantly different from .300

# Confidence interval for mean batting average
t.test(recent_batting$BA)$conf.int

# ----------------------------------------------------------------------------
# Part 5: Statistical inference - two samples
# Comparing two groups
# ----------------------------------------------------------------------------

# Question: Do American League and National League batters
# have different batting averages in recent years?

# Two-sample t-test
t.test(BA ~ lgID, data = recent_batting)

# Interpretation:
# - Check the p-value
# - Check the confidence interval for the difference
# - Do we have evidence of a difference between leagues?

# Boxplot to visualize
ggplot(recent_batting, aes(x = lgID, y = BA, fill = lgID)) +
  geom_boxplot() +
  geom_jitter(alpha = 0.2, width = 0.2) +
  labs(title = "Batting Average by League (2019-2023)",
       x = "League",
       y = "Batting Average") +
  theme_minimal()

# ----------------------------------------------------------------------------
# Part 6: Categorical data analysis
# Chi-square test, contingency tables
# ----------------------------------------------------------------------------

# Create a binary variable: "power hitter" (25+ home runs)
modern_batting <- modern_batting |>
  mutate(power_hitter = ifelse(HR >= 25, "Yes", "No"))

# Cross-tabulation
power_table <- table(droplevels(modern_batting$lgID), modern_batting$power_hitter)
power_table

# Proportions
prop.table(power_table, margin = 1) # Row proportions

# Chi-square test of independence
# H0: League and power hitting status are independent
# Ha: League and power hitting status are associated
chisq.test(power_table)

# ----------------------------------------------------------------------------
# Part 7: Simple linear regression
# lm(), coefficients, interpretation, diagnostics
# ----------------------------------------------------------------------------

# Question: Can we predict batting average from on-base percentage (OBP)?
# First calculate OBP = (H + BB + HBP) / (AB + BB + HBP + SF)

modern_batting <- modern_batting |>
  mutate(OBP = (H + BB + HBP) / (AB + BB + HBP + SF))

# Remove missing values
regression_data <- modern_batting |>
  filter(!is.na(OBP), !is.na(BA))

# Fit the model
model1 <- lm(BA ~ OBP, data = regression_data)
summary(model1)

# Interpretation:
# - Intercept: expected BA when OBP = 0 (not meaningful in context)
# - Slope: for each 0.01 increase in OBP, BA increases by...
# - R-squared: proportion of variance in BA explained by OBP
# - P-value for slope: is there a significant relationship?

# Visualize the regression line
ggplot(regression_data, aes(x = OBP, y = BA)) +
  geom_point(alpha = 0.3) +
  geom_smooth(method = "lm", se = TRUE) +
  labs(title = "Batting Average vs On-Base Percentage",
       x = "On-Base Percentage (OBP)",
       y = "Batting Average") +
  theme_minimal()

# Regression diagnostics
par(mfrow = c(2, 2))
plot(model1)
par(mfrow = c(1, 1))

# Making predictions
# Predict BA for a player with OBP = 0.350
new_player <- data.frame(OBP = 0.350)
predict(model1, newdata = new_player, interval = "confidence")

# ----------------------------------------------------------------------------
# Part 8: Multiple regression
# Multiple predictors, F-tests, model comparison
# ----------------------------------------------------------------------------

# Question: Can we better predict batting average using multiple variables?
# Let's add stolen bases (SB) and strikeouts (SO)

# Create strikeout rate (SO per AB)
regression_data <- regression_data |>
  mutate(SO_rate = SO / AB)

# Fit multiple regression model
model2 <- lm(BA ~ OBP + SB + SO_rate, data = regression_data)
summary(model2)

# Compare models using F-test
anova(model1, model2)

# Interpretation:
# - Did adding SB and SO_rate significantly improve the model?
# - Compare R-squared values
# - Compare adjusted R-squared values

# Confidence intervals for coefficients
confint(model2)

# ----------------------------------------------------------------------------
# Part 9: Logistic regression
# Binary outcomes, glm(), odds ratios, prediction
# ----------------------------------------------------------------------------

# Question: Can we predict whether a player will be a "power hitter"
# based on their batting statistics?

# Ensure power_hitter is a factor
regression_data$power_hitter <- factor(regression_data$power_hitter)

# Fit logistic regression
logit_model <- glm(power_hitter ~ BA + OBP + SO_rate,
                   data = regression_data,
                   family = binomial)
summary(logit_model)

# Interpretation:
# - Coefficients are on the log-odds scale
# - Positive coefficient: increases odds of being a power hitter
# - Negative coefficient: decreases odds


# ----------------------------------------------------------------------------
# Part 10: Bringing it together - Hall of Fame analysis
# ----------------------------------------------------------------------------

# Load Hall of Fame data
data("HallOfFame")

# Get career statistics for position players
data("People")

# Create career batting stats
career_stats <- Batting |>
  group_by(playerID) |>
  summarize(
    career_AB = sum(AB, na.rm = TRUE),
    career_H = sum(H, na.rm = TRUE),
    career_HR = sum(HR, na.rm = TRUE),
    career_R = sum(R, na.rm = TRUE),
    career_RBI = sum(RBI, na.rm = TRUE),
    seasons = n()
  ) |>
  filter(career_AB >= 3000) |> # Only players with substantial careers
  mutate(career_BA = career_H / career_AB)

# Merge with Hall of Fame status
hof_inductees <- HallOfFame |>
  filter(inducted == "Y", category == "Player") |>
  select(playerID, inducted)

career_stats <- career_stats |>
  left_join(hof_inductees, by = "playerID") |>
  mutate(HOF = ifelse(!is.na(inducted), "Yes", "No"))

# Descriptive statistics by HOF status
career_stats |>
  group_by(HOF) |>
  summarize(
    n = n(),
    mean_BA = mean(career_BA),
    mean_HR = mean(career_HR),
    mean_H = mean(career_H)
  )

# Hypothesis test: Do HOF players have higher career BA?
t.test(career_BA ~ HOF, data = career_stats)

# Visualization
ggplot(career_stats, aes(x = HOF, y = career_BA, fill = HOF)) +
  geom_boxplot() +
  geom_jitter(width = 0.2, alpha = 0.3) +
  labs(title = "Career Batting Average: Hall of Fame vs Non-HOF",
       subtitle = "Players with 3000+ career at bats",
       x = "Hall of Fame Status",
       y = "Career Batting Average") +
  theme_minimal()

# Logistic regression: Predict HOF status
career_stats$HOF_binary <- ifelse(career_stats$HOF == "Yes", 1, 0)

hof_model <- glm(HOF_binary ~ career_BA + career_HR + career_H, 
                 data = career_stats, 
                 family = binomial)
summary(hof_model)

