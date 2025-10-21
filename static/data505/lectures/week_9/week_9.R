## -----------------------------------------------------------------------------
#| include: false

invisible(NULL)
library(dplyr)
library(ggplot2)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Illustrating the regression line and residuals
#| echo: true
#| fig-height: 4
#| fig-width: 6

set.seed(42)
x <- rnorm(20, mean = 10, sd = 2)
y <- 2 + 1.5 * x + rnorm(20, mean = 0, sd = 2)
df <- data.frame(x = x, y = y)
fit <- lm(y ~ x, data = df)

ggplot(df, aes(x = x, y = y)) +
  geom_point(size = 3, color = "steelblue") +
  geom_smooth(method = "lm", se = FALSE, color = "red", linewidth = 1) +
  geom_segment(aes(xend = x, yend = fitted(fit)), 
               linetype = "dashed", alpha = 0.5) +
  labs(title = "Linear regression: fitted line and residuals",
       x = "Predictor (X)", y = "Response (Y)") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# model <- lm(response ~ predictor, data = dataset)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: View the cars dataset
#| echo: true

data(cars)
head(cars)
str(cars)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Scatterplot of speed vs. stopping distance
#| echo: true
#| fig-height: 4
#| fig-width: 6

ggplot(cars, aes(x = speed, y = dist)) +
  geom_point(size = 3, color = "steelblue") +
  labs(title = "Car speed vs. stopping distance",
       x = "Speed (mph)", y = "Stopping distance (ft)") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true

cars_model <- lm(dist ~ speed, data = cars)
summary(cars_model)


## -----------------------------------------------------------------------------
#| echo: true

summary(cars_model)


## -----------------------------------------------------------------------------
#| echo: true

coef(cars_model)


## -----------------------------------------------------------------------------
#| echo: true

summary(cars_model)$coefficients


## -----------------------------------------------------------------------------
#| echo: true

confint(cars_model, level = 0.95)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Scatterplot with fitted regression line
#| echo: true
#| fig-height: 4
#| fig-width: 6

ggplot(cars, aes(x = speed, y = dist)) +
  geom_point(size = 3, color = "steelblue") +
  geom_smooth(method = "lm", se = TRUE, color = "red") +
  labs(title = "Car speed vs. stopping distance",
       subtitle = "With fitted regression line and 95% confidence band",
       x = "Speed (mph)", y = "Stopping distance (ft)") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true

# Predict stopping distance for a car going 22 mph
new_data <- data.frame(speed = 22)
predict(cars_model, newdata = new_data)


## -----------------------------------------------------------------------------
#| echo: true

# Get prediction with confidence interval
predict(cars_model, newdata = new_data, interval = "confidence")


## -----------------------------------------------------------------------------
#| echo: true

# Get prediction interval for individual observation
predict(cars_model, newdata = new_data, interval = "prediction")


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Standard diagnostic plots for regression
#| echo: true
#| fig-height: 6
#| fig-width: 8

par(mfrow = c(2, 2))
plot(cars_model)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Simulate non-linear association
#| echo: true
#| fig-height: 4
#| fig-width: 5

set.seed(123)
x <- seq(-10, 10, length.out = 50)
y <- 2 + 0.1 * x^2 + rnorm(50, sd = 3)
df_nonlinear <- data.frame(x, y)

ggplot(df_nonlinear, aes(x, y)) +
  geom_point() +
  geom_smooth(method = "lm", se = FALSE, 
              color = "red") +
  labs(title = "Linear fit to curved data",
       subtitle = "Red line misses the pattern") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| fig-height: 4
#| fig-width: 7

model_nonlinear <- lm(y ~ x, data = df_nonlinear)
par(mfrow = c(1, 2))
plot(model_nonlinear, which = 1)  # Residuals vs. Fitted
plot(model_nonlinear, which = 2)  # Q-Q plot


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Simulate non-constant variance
#| echo: true
#| fig-height: 4
#| fig-width: 5

set.seed(456)
x <- runif(100, 0, 10)
y <- 2 + 3 * x + rnorm(100, sd = x)  # SD increases with x
df_hetero <- data.frame(x, y)

ggplot(df_hetero, aes(x, y)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE, 
              color = "red") +
  labs(title = "Heteroskedasticity",
       subtitle = "Variance increases with x") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| fig-height: 4
#| fig-width: 7

model_hetero <- lm(y ~ x, data = df_hetero)
par(mfrow = c(1, 2))
plot(model_hetero, which = 1)  # Residuals vs. Fitted
plot(model_hetero, which = 3)  # Scale-Location


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Simulate non-normal errors
#| echo: true
#| fig-height: 4
#| fig-width: 5

set.seed(789)
x <- runif(100, 0, 10)
# Add some extreme outliers
y <- 2 + 3 * x + c(rt(95, df = 2) * 2, 
                    rnorm(5, mean = 20, sd = 1))
df_nonnormal <- data.frame(x, y)

ggplot(df_nonnormal, aes(x, y)) +
  geom_point() +
  geom_smooth(method = "lm", se = TRUE, 
              color = "red") +
  labs(title = "Heavy-tailed residuals",
       subtitle = "With outliers") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| fig-height: 4
#| fig-width: 7

model_nonnormal <- lm(y ~ x, data = df_nonnormal)
par(mfrow = c(1, 2))
plot(model_nonnormal, which = 2)  # Q-Q plot
plot(model_nonnormal, which = 5)  # Residuals vs Leverage


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Simulate correlated errors
#| echo: true
#| fig-height: 4
#| fig-width: 5

set.seed(101)
n <- 100
x <- 1:n
errors <- arima.sim(n = n, 
                    list(ar = 0.7), sd = 2)
y <- 2 + 0.5 * x + errors
df_autocor <- data.frame(x, y)

ggplot(df_autocor, aes(x, y)) +
  geom_point() +
  geom_line(alpha = 0.3) +
  geom_smooth(method = "lm", se = TRUE, 
              color = "red") +
  labs(title = "Autocorrelated errors",
       subtitle = "Time series data") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| eval: false

# model <- lm(response ~ predictor1 + predictor2 + predictor3,
#             data = dataset)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: View the mtcars dataset
#| echo: true

data(mtcars)
head(mtcars)


## -----------------------------------------------------------------------------
#| echo: true

mtcars_model <- lm(mpg ~ wt + hp, data = mtcars)
summary(mtcars_model)


## -----------------------------------------------------------------------------
#| echo: true

coef(mtcars_model)


## -----------------------------------------------------------------------------
#| echo: true

# Simple model: mpg vs weight only
model1 <- lm(mpg ~ wt, data = mtcars)

# Multiple model: mpg vs weight and horsepower
model2 <- lm(mpg ~ wt + hp, data = mtcars)

# Compare R-squared
summary(model1)$r.squared
summary(model2)$r.squared


## -----------------------------------------------------------------------------
#| echo: true

anova(model1, model2)


## -----------------------------------------------------------------------------
#| echo: true

mtcars$cyl <- factor(mtcars$cyl)
cyl_model <- lm(mpg ~ cyl, data = mtcars)
summary(cyl_model)


## -----------------------------------------------------------------------------
#| echo: true

coef(cyl_model)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Boxplot with group means
#| echo: true
#| fig-height: 4
#| fig-width: 6

ggplot(mtcars, aes(x = cyl, y = mpg, fill = cyl)) +
  geom_boxplot(alpha = 0.5) +
  stat_summary(fun = mean, geom = "point", shape = 18, size = 4, color = "red") +
  labs(title = "MPG by number of cylinders",
       subtitle = "Red diamonds show group means (regression estimates)",
       x = "Number of cylinders", y = "Miles per gallon") +
  theme_minimal() +
  theme(legend.position = "none")


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Load and display the penguins dataset
#| echo: true
#| message: false

if(!require(palmerpenguins)) install.packages("palmerpenguins")
library(palmerpenguins)
data(penguins)
str(penguins)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Scatterplot colored by species
#| echo: true
#| fig-height: 4
#| fig-width: 7
#| message: false
#| warning: false

ggplot(penguins, aes(x = flipper_length_mm, y = body_mass_g, color = species)) +
  geom_point(size = 2, alpha = 0.6) +
#   geom_smooth(method = "lm", se = FALSE) +
  labs(title = "Body mass vs. flipper length by species",
       x = "Flipper length (mm)", y = "Body mass (g)") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| warning: false

# Remove missing values
penguins_clean <- na.omit(penguins[, c("body_mass_g", "flipper_length_mm", "species")])

# Fit model
penguin_model <- lm(body_mass_g ~ flipper_length_mm + species, data = penguins_clean)
summary(penguin_model)


## -----------------------------------------------------------------------------
#| echo: true

coef(penguin_model)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Diagnostic plots
#| echo: true
#| fig-height: 6
#| fig-width: 8

par(mfrow = c(2, 2))
plot(penguin_model)


## -----------------------------------------------------------------------------
#| echo: true

# Predict body mass for a Gentoo penguin with 210 mm flippers
new_penguin <- data.frame(
  flipper_length_mm = 210,
  species = "Gentoo"
)

predict(penguin_model, newdata = new_penguin, interval = "prediction")

