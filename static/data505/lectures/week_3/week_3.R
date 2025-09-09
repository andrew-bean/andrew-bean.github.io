## -----------------------------------------------------------------------------
data(diamonds, package = "ggplot2") # load an example dataset
class(diamonds) # inherits from data.frame, among other classes
typeof(diamonds) # basic type is a list


## -----------------------------------------------------------------------------
str(diamonds)


## -----------------------------------------------------------------------------
str(diamonds$price) # structure of the "price" variable
identical(diamonds$price, diamonds[["price"]])


## -----------------------------------------------------------------------------
price <- diamonds$price
identical(price, diamonds$price)


## -----------------------------------------------------------------------------
price_num <- as.numeric(price)
str(price_num)
price_chr <- as.character(price)
str(price_chr)


## -----------------------------------------------------------------------------
object.size(price)
object.size(price_num)
object.size(price_chr)


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Printout of the diamonds data

library(DT) # for the tabular display
DT::datatable(diamonds, options = list(pageLength = 5))


## -----------------------------------------------------------------------------
x <- c(1, 2, 2, 3, 4)
mean(x)
median(x)
# Mode is not built-in; use table(x)


## -----------------------------------------------------------------------------
range(x)
var(x)
sd(x)
IQR(x)


## -----------------------------------------------------------------------------
species <- c("Adelie", "Chinstrap", "Adelie", "Gentoo")
table(species)
prop.table(table(species))


## -----------------------------------------------------------------------------
str(diamonds)


## ----mean---------------------------------------------------------------------
mean(diamonds$price)


## ----median .incremental------------------------------------------------------
median(diamonds$price)


## ----range .incremental-------------------------------------------------------
range(diamonds$price)


## ----sd .incremental----------------------------------------------------------
sd(diamonds$price)
var(diamonds$price)
sd(diamonds$price) == sqrt(var(diamonds$price))


## -----------------------------------------------------------------------------
summary(diamonds$price)


## ----iqr----------------------------------------------------------------------
IQR(diamonds$price)


## -----------------------------------------------------------------------------
hist(diamonds$price)


## -----------------------------------------------------------------------------
str(diamonds$cut) # its class in R is a factor


## -----------------------------------------------------------------------------
levels(diamonds$cut)


## -----------------------------------------------------------------------------
table(diamonds$cut)


## -----------------------------------------------------------------------------
prop.table(table(diamonds$cut))


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Printout of the Boston housing data

data("Boston", package = "MASS")
DT::datatable(Boston, options = list(pageLength = 5))


## -----------------------------------------------------------------------------
#| code-fold: true
#| code-summary: Read and display descriptions of the variables
#| echo: false

header <- readLines(
  "https://lib.stat.cmu.edu/datasets/boston",
   n = 22
)
varnames <- tolower(trimws(substr(header[8:21], 2, 10)))
vardesc <- trimws(substr(header[8:21], 11, 100))
vars <- dplyr::tibble(
  variable = varnames[varnames %in% names(Boston)],
  description = vardesc[varnames %in% names(Boston)]
)
knitr::kable(vars)


## -----------------------------------------------------------------------------
hist(Boston$crim, xlab = vardesc[1])


## -----------------------------------------------------------------------------
boxplot(Boston$crim, ylab = vardesc[1])


## -----------------------------------------------------------------------------
mean(Boston$crim)


## -----------------------------------------------------------------------------
median(Boston$crim)

