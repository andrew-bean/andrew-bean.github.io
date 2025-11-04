## -----------------------------------------------------------------------------
#| include: false

invisible(NULL)
library(dplyr)
library(ggplot2)


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# function_name <- function(arg1, arg2, ...) {
#   # Function body: code that does something
#   result <- arg1 + arg2
# 
#   # Return value (implicit or explicit)
#   return(result)
# }


## -----------------------------------------------------------------------------
#| echo: true

# Function to calculate the mean of squared deviations
mean_squared_deviation <- function(x) {
  mean_x <- mean(x)
  squared_devs <- (x - mean_x)^2
  result <- mean(squared_devs)
  return(result)
}

# Test it
values <- c(2, 4, 6, 8, 10)
mean_squared_deviation(values)

# Compare to variance
var(values) * (length(values) - 1) / length(values)


## -----------------------------------------------------------------------------
#| echo: true

# Implicit return
add_implicit <- function(a, b) {
  a + b
}

# Explicit return
add_explicit <- function(a, b) {
  result <- a + b
  return(result)
}

add_implicit(3, 5)
add_explicit(3, 5)


## -----------------------------------------------------------------------------
#| echo: true

# Function with default argument
greet <- function(name, greeting = "Hello") {
  paste(greeting, name)
}

greet("Alice")
greet("Bob", greeting = "Hi")


## -----------------------------------------------------------------------------
#| echo: true

# Z-score standardization
standardize <- function(x, na.rm = TRUE) {
  mean_x <- mean(x, na.rm = na.rm)
  sd_x <- sd(x, na.rm = na.rm)
  z <- (x - mean_x) / sd_x
  return(z)
}

# Test it
test_data <- c(10, 20, 30, 40, 50, NA)
standardize(test_data)

# The standardized values have mean 0 and sd 1
mean(standardize(test_data), na.rm = TRUE)
sd(standardize(test_data), na.rm = TRUE)


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# df$x1 <- (df$x1 - mean(df$x1)) / sd(df$x1)
# df$x2 <- (df$x2 - mean(df$x2)) / sd(df$x2)
# df$x3 <- (df$x3 - mean(df$x3)) / sd(df$x3)


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# standardize <- function(x) {
#   (x - mean(x)) / sd(x)
# }
# 
# df$x1 <- standardize(df$x1)
# df$x2 <- standardize(df$x2)
# df$x3 <- standardize(df$x3)


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # Apply standardize to multiple columns at once
# df <- df |>
#   mutate(across(c(x1, x2, x3), standardize))


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # Load data
# data <- read.csv("raw_data.csv")
# 
# # Clean data
# data$x <- ifelse(data$x < 0, NA, data$x)
# data$y <- log(data$y + 1)
# data <- data[complete.cases(data), ]
# 
# # Analyze
# model <- lm(y ~ x, data = data)
# summary(model)
# 
# # Visualize
# plot(data$x, data$y)
# abline(model, col = "red")


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # Step 1: Load data
# load_raw_data <- function(filepath) {
#   read.csv(filepath)
# }
# 
# # Step 2: Clean data
# clean_data <- function(data) {
#   data |>
#     mutate(
#       x = ifelse(x < 0, NA, x),
#       y = log(y + 1)
#     ) |>
#     filter(complete.cases(data))
# }
# 
# # Step 3: Fit model
# fit_model <- function(data) {
#   lm(y ~ x, data = data)
# }
# 
# # Step 4: Create plot
# plot_results <- function(data, model) {
#   ggplot(data, aes(x = x, y = y)) +
#     geom_point() +
#     geom_smooth(method = "lm", color = "red")
# }
# 
# # Execute pipeline
# data <- load_raw_data("raw_data.csv")
# data_clean <- clean_data(data)
# model <- fit_model(data_clean)
# plot_results(data_clean, model)


## -----------------------------------------------------------------------------
#| echo: true

# Good: clear name, single purpose, documented
#' Calculate the coefficient of variation
#' 
#' @param x A numeric vector
#' @param na.rm Logical; should missing values be removed?
#' @return The coefficient of variation (sd/mean)
coefficient_of_variation <- function(x, na.rm = TRUE) {
  sd(x, na.rm = na.rm) / mean(x, na.rm = na.rm)
}


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # Main analysis pipeline
# source("R/01_load.R")
# source("R/02_clean.R")
# source("R/03_analyze.R")
# source("R/04_visualize.R")
# 
# # Load data
# raw_data <- load_raw_data("data/raw/survey_data.csv")
# 
# # Clean data
# clean_data <- clean_survey_data(raw_data)
# 
# # Analyze
# summary_stats <- calculate_summary_statistics(clean_data)
# model_results <- fit_regression_model(clean_data)
# 
# # Visualize
# plot_distribution(clean_data, "age")
# plot_regression_results(clean_data, model_results)
# 
# # Save results
# save_results(summary_stats, "output/tables/summary_stats.csv")
# save_plot(last_plot(), "output/figures/regression_plot.png")


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # Example targets pipeline
# library(targets)
# 
# list(
#   tar_target(raw_data, load_raw_data("data/raw/survey.csv")),
#   tar_target(clean_data, clean_survey_data(raw_data)),
#   tar_target(model, fit_regression_model(clean_data)),
#   tar_target(plot, plot_results(clean_data, model))
# )


## -----------------------------------------------------------------------------
#| echo: true

# Example function
calculate_range <- function(x, na.rm = TRUE) {
  max(x, na.rm = na.rm) - min(x, na.rm = na.rm)
}

# Test with normal data
calculate_range(1:10)  # Should be 9

# Test with NA values
calculate_range(c(1, 5, NA))  # Should be 4

# Test with single value
calculate_range(5)  # Should be 0

# Test with empty vector - will give warning
# calculate_range(numeric(0))


## -----------------------------------------------------------------------------
#| echo: true

#' Calculate standardized effect size (Cohen's d)
#'
#' @param group1 Numeric vector for group 1
#' @param group2 Numeric vector for group 2
#' @param na.rm Logical; should missing values be removed? Default TRUE
#'
#' @return Numeric value representing Cohen's d effect size
#' @export
#'
#' @examples
#' group_a <- c(10, 12, 14, 16, 18)
#' group_b <- c(15, 17, 19, 21, 23)
#' cohens_d(group_a, group_b)
cohens_d <- function(group1, group2, na.rm = TRUE) {
  mean_diff <- mean(group1, na.rm = na.rm) - mean(group2, na.rm = na.rm)
  pooled_sd <- sqrt((var(group1, na.rm = na.rm) + var(group2, na.rm = na.rm)) / 2)
  return(mean_diff / pooled_sd)
}


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # BAD: modifies global variable
# process_data <- function() {
#   data <<- data |> filter(!is.na(x))  # Don't do this!
# }
# 
# # GOOD: returns a value
# process_data <- function(data) {
#   data |> filter(!is.na(x))
# }


## -----------------------------------------------------------------------------
#| echo: true

# BAD: will fail with NAs
mean_without_handling <- function(x) {
  sum(x) / length(x)
}

# GOOD: handles NAs
mean_with_handling <- function(x, na.rm = TRUE) {
  if (na.rm) {
    x <- x[!is.na(x)]
  }
  sum(x) / length(x)
}


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # BAD: does too many things
# analyze_everything <- function(data) {
#   # 100 lines of code doing loading, cleaning, analyzing, plotting...
# }
# 
# # GOOD: break into smaller functions
# load_data <- function(file) { ... }
# clean_data <- function(data) { ... }
# analyze_data <- function(data) { ... }
# plot_results <- function(results) { ... }


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# # BAD
# f <- function(x, y) { ... }
# calc <- function(d) { ... }
# 
# # GOOD
# calculate_correlation <- function(variable1, variable2) { ... }
# summarize_by_group <- function(data) { ... }

