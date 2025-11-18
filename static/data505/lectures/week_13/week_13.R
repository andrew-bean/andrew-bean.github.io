## -----------------------------------------------------------------------------
#| include: false

invisible(NULL)
library(dplyr)
library(ggplot2)
library(gt)


## -----------------------------------------------------------------------------
#| echo: true
#| code-fold: true
#| code-summary: Construct dose-toxicity dataset (dlt_data) and display empirical rates.
#| class: smaller

dlt_data <- tibble::tibble(
  dose = c(1, 2.5, 5, 10, 20, 25),
  num_patients = c(3, 4, 5, 4, 6, 2),
  num_toxicities = c(0, 1, 0, 1, 1, 2)
) |>
  dplyr::mutate(empirical_rate = num_toxicities / num_patients)

dlt_data |>
  gt() |>
  tab_header(title = "Drug A Dose–Toxicity Data (DLTs)") |>
  cols_label(
    dose = "Dose A (mg)",
    num_patients = "Patients",
    num_toxicities = "DLTs",
    empirical_rate = "Proportion of DLTs"
  ) |>
  fmt_percent(columns = empirical_rate, decimals = 1) |>
  fmt_number(columns = c(num_patients, num_toxicities), decimals = 0) |>
  tab_style(
    style = cell_fill(color = "#f2f7ff"),
    locations = cells_column_labels()
  ) |>
  opt_table_font(font = "Arial")


## -----------------------------------------------------------------------------
#| echo: true

fit_dose <- glm(cbind(num_toxicities, num_patients - num_toxicities) ~ I(log(dose)),
                data = dlt_data,
                family = binomial())
summary(fit_dose)


## -----------------------------------------------------------------------------
# Predict the probability of a DLT for dose = 25
predict(fit_dose, newdata = data.frame(dose = c(1, 2.5, 5, 10, 20, 25)), type = "response")


## -----------------------------------------------------------------------------
#| echo: true
#| fig-height: 3.6
#| fig-width: 6
#| out-width: 100%
#| code-fold: true
#| code-summary: Plot on probability scale

# Probability scale
dose_grid <- tibble::tibble(dose = seq(min(dlt_data$dose), max(dlt_data$dose), length.out = 100)) |>
  dplyr::mutate(p_hat = predict(fit_dose, newdata = dplyr::cur_data(), type = "response"))

ggplot(dlt_data, aes(x = dose, y = empirical_rate)) +
  geom_point(size = 3, color = "#1f77b4") +
  geom_line(data = dose_grid, aes(y = p_hat), color = "#d62728", linewidth = 1) +
  scale_y_continuous(labels = scales::percent_format(accuracy = 1)) +
  scale_x_log10() + 
  labs(title = "Probability scale",
       x = "Dose A (mg)",
       y = "Probability of DLT") +
  theme_minimal()


## -----------------------------------------------------------------------------
#| echo: true
#| fig-height: 3.6
#| fig-width: 6
#| out-width: 100%
#| code-fold: true
#| code-summary: Plot on linear predictor scale

# Linear predictor (log-odds) scale
dose_grid_lp <- tibble::tibble(dose = seq(min(dlt_data$dose), max(dlt_data$dose), length.out = 100))
pred_lp <- predict(fit_dose, newdata = dose_grid_lp, type = "link", se.fit = TRUE)
dose_grid_lp$eta_hat <- as.numeric(pred_lp$fit)

ggplot(dose_grid_lp, aes(x = dose, y = eta_hat)) +
  geom_line(color = "#d62728", linewidth = 1) +
  scale_x_log10() + 
  labs(title = "Linear predictor scale",
       x = "Dose A (mg)",
       y = "Log-odds of DLT") +
  theme_minimal()

