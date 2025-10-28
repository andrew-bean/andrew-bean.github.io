## -----------------------------------------------------------------------------
#| include: false

invisible(NULL)
library(dplyr)
library(ggplot2)


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

