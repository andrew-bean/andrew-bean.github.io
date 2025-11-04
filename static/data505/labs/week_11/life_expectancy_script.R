# Global Health Analysis - script version
# This script analyzes global health and development data from gapminder
# Your job: refactor this into organized functions!

library(gapminder)
library(dplyr)
library(ggplot2)

#===============================================================================
# FUNCTION 1: gapminder_prepare_data() --> R/01_prepare_data.R
#===============================================================================

data(gapminder)
health_data <- gapminder |>
  filter(year == 2007) |>
  mutate(
    log_gdp = log10(gdpPercap),
    log_pop = log10(pop)
  )

#===============================================================================
# FUNCTION 2: gapminder_plot_life_vs_gdp() --> R/02_visualize.R
#===============================================================================

# With log scale (log_scale = TRUE)
ggplot(health_data, aes(x = gdpPercap, y = lifeExp)) +
  geom_point(aes(color = continent), size = 2, alpha = 0.6) +
  geom_smooth(method = "lm", color = "black", se = TRUE) +
  scale_x_log10() +
  labs(title = "Life Expectancy vs. GDP per Capita (Log Scale)",
       x = "GDP per Capita (USD, log scale)",
       y = "Life Expectancy (years)",
       color = "Continent") +
  theme_minimal()

# Without log scale (log_scale = FALSE)
ggplot(health_data, aes(x = gdpPercap, y = lifeExp)) +
  geom_point(aes(color = continent), size = 2, alpha = 0.6) +
  geom_smooth(method = "lm", color = "black", se = TRUE) +
  labs(title = "Life Expectancy vs. GDP per Capita",
       x = "GDP per Capita (USD)",
       y = "Life Expectancy (years)",
       color = "Continent") +
  theme_minimal()

#===============================================================================
# FUNCTION 3: gapminder_fit_linear_models() --> R/03_model.R
#===============================================================================

model1 <- lm(lifeExp ~ log_gdp, data = health_data)
model2 <- lm(lifeExp ~ log_gdp + continent, data = health_data)
model3 <- lm(lifeExp ~ log_gdp + continent + log_pop, data = health_data)

#===============================================================================
# FUNCTION 4: gapminder_compare_models() --> R/04_compare.R
#===============================================================================

anova(model1, model2, model3)

#===============================================================================
# FUNCTION 5: gapminder_predict_with_all_models() --> R/05_predict.R
#===============================================================================

# New countries data
new_countries <- data.frame(
  country_type = c("Lower-income African", "Medium-income Asian", "Higher-income European"),
  log_gdp = c(log10(800), log10(5000), log10(35000)),
  continent = c("Africa", "Asia", "Europe"),
  log_pop = c(log10(5e6), log10(5e7), log10(1e7))
)

# Get predictions from each model
pred1 <- predict(model1, newdata = new_countries, interval = "confidence")
pred2 <- predict(model2, newdata = new_countries, interval = "confidence")
pred3 <- predict(model3, newdata = new_countries, interval = "confidence")

# Combine all predictions
all_predictions <- bind_rows(
  as.data.frame(pred1) |> mutate(model = "model1", country_id = 1:3),
  as.data.frame(pred2) |> mutate(model = "model2", country_id = 1:3),
  as.data.frame(pred3) |> mutate(model = "model3", country_id = 1:3)
) |>
  left_join(
    new_countries |> mutate(country_id = 1:3),
    by = "country_id"
  )

#===============================================================================
# FUNCTION 6: gapminder_prediction_plot() --> R/05_predict.R
#===============================================================================

ggplot(all_predictions, aes(x = model, y = fit, color = continent)) +
  geom_point(size = 3, position = position_dodge(width = 0.5)) +
  geom_errorbar(aes(ymin = lwr, ymax = upr),
                width = 0.2,
                position = position_dodge(width = 0.5)) +
  facet_wrap(~country_type) +
  labs(title = "Predicted Life Expectancy by Model and Country Type",
       x = "Model",
       y = "Predicted Life Expectancy (years)") +
  theme_minimal()

