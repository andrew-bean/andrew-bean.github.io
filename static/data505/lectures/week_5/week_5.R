## -----------------------------------------------------------------------------
#| message: false
#| warning: false

library(tidyverse) # for data manipulation, ggplots is part of this
library(maps)
library(plotly) # for interactive plots


## ----eval=F-------------------------------------------------------------------
# ?USArrests
# str(USArrests)


## -----------------------------------------------------------------------------
USArrests <- USArrests |> 
  mutate(State = row.names(USArrests)) |>
  mutate(UrbanPop_tile = ntile(UrbanPop, 3)) |>
  mutate(UrbanPop_Cat = factor(UrbanPop_tile, 
                               levels=c(1,2,3),
                               labels=c('Low',"Medium","High"),
                               ordered=T))


## ----echo=T,fig.height=3,fig.width=4------------------------------------------
hist(USArrests$Murder,
      nclass=30,
     main='Murder rate per 100000',
    col='pink', 
     ylab=NA, 
     yaxt='n',
    xlab=NA)


## -----------------------------------------------------------------------------
boxplot(USArrests$Murder)


## -----------------------------------------------------------------------------
stem(USArrests$Murder)


## ----fig.height=4,fig.width=6-------------------------------------------------
boxplot(USArrests$Assault ~ USArrests$UrbanPop_Cat,
        col='pink',
        border='darkblue',
        pch=16,
        xlab='Urban population',
        ylab='Assault rate')


## ----echo=T,fig.height=4,fig.width=4------------------------------------------
plot(USArrests$UrbanPop,USArrests$Assault)


## ----fig.width = 4, fig.height = 3,out.width="60%"----------------------------
ggplot(data=USArrests,
       mapping=aes(x=UrbanPop,y=Assault)) + 
  geom_point()


## ----fig.width = 4, fig.height = 3,out.width="60%"----------------------------
ggplot(data=USArrests,
       mapping=aes(x=UrbanPop_Cat,y = Assault, fill=UrbanPop_Cat)) + 
  geom_boxplot()


## -----------------------------------------------------------------------------
#| fig-width: 5
#| fig-height: 2.6
ggplot(data=USArrests,
       mapping=aes(x=UrbanPop,y=Assault)) + 
  geom_point()


## -----------------------------------------------------------------------------
#| fig-width: 5
#| fig-height: 2.6

ggplot(data=USArrests,
       mapping=aes(
        x=UrbanPop_Cat,
        y = Assault,
        fill=UrbanPop_Cat
       )) + 
  geom_boxplot()


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data = USArrests,  aes(x = Murder)) + 
  geom_histogram()


## ----fig.width = 3.5, fig.height = 2, eval=F----------------------------------
# ggplot(data = USArrests,  aes(x = Murder)) +
#   geom_histogram(binwidth=5,
#                  fill="orange",
#                  color="blue")


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data = USArrests, aes(x = Murder, fill=UrbanPop_Cat)) + 
  geom_histogram(binwidth=5, color="blue")


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data=USArrests, 
       mapping=aes(x=UrbanPop_Cat)) +
  geom_bar()


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data=USArrests,
       aes(x=Murder,y=Assault,label=State)) + 
  geom_text()


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data=USArrests, 
       mapping=aes(x=UrbanPop_Cat)) +
  geom_bar() + 
  theme_bw() +
  ggtitle('Bar graph') +
  labs(x='Urban population percentage')


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data=USArrests,
       aes(x=Murder,y=Assault,color=UrbanPop)) + 
  geom_point()+
  theme_bw() +
  ggtitle('Violent Crime Rates') +
  labs(x='Murder',y="Assault",color='Urban Pop Percentage') +
  scale_color_gradient(low="lightgreen",high="black") 


## ----fig.width = 3.5, fig.height = 2------------------------------------------
ggplot(data=USArrests, 
       aes(x=Murder,fill=UrbanPop_Cat)) +
  geom_histogram() +
  scale_fill_manual(values=c("Low"='green',"Medium"='purple', "High"="darkgrey")) +
  theme_minimal()


## ----eval=F-------------------------------------------------------------------
# summary(USArrests)
# USArrests |> summary # magrittr / dplyr pipe
# USArrests |> summary # base R pipe (R >= 4.0)


## ----eval=F-------------------------------------------------------------------
# USArrests |> filter(UrbanPop > 80) |> select(Murder, UrbanPop)
# select(filter(USArrests,UrbanPop > 80), Murder, UrbanPop)


## ----eval=F-------------------------------------------------------------------
# # filter: subset data according to some condition
# USArrests |>
#   filter(UrbanPop_Cat=='High', Murder > 10)
# 
# # slice: subset specific rows
# # select: subset specific columns
# USArrests |>
#   slice(1:5) |>
#   select(Murder,Assault)
# 
# # arrange: sort by a variable
# USArrests |>
#   arrange(desc(Murder)) |>
#   slice(1:5)
# 
# # summarise: calculate summary statistics
# USArrests |>
#   summarise(mean(Murder),median(Murder),count=length(Murder))
# 
# 
# # mutate: create new variables
# USArrests |>
#   mutate(Violent = Murder + Assault + Rape) |>
#   arrange(desc(Violent)) |>
#   select(Violent)
# 
# # group_by: look at subset groups of data
# USArrests |>
#   group_by(UrbanPop_Cat) |>
#   summarise(mean(Murder), median(Murder))


## -----------------------------------------------------------------------------
#| fig-width: 5
#| fig-height: 2.6

USArrests |> 
  mutate(Urban = ifelse(UrbanPop > 80, "Yes", "No")) |>
  ggplot(aes(x=Murder, y=Assault, color=Urban)) +
  geom_point() +
  theme_bw()


## ----eval=T,echo=T------------------------------------------------------------
# see ?map_data
mymap <- map_data(map="state")


## ----eval=F-------------------------------------------------------------------
# plot(mymap$long,mymap$lat)
# 
# ggplot(data=mymap,aes(x=long,y=lat,group=group)) +
#   geom_polygon() +
#   coord_fixed(1.4) +
#   theme_void()


## -----------------------------------------------------------------------------
plot(mymap$long,mymap$lat)


## -----------------------------------------------------------------------------
ggplot(data=mymap,aes(x=long,y=lat,group=group)) +
  geom_polygon() +
  coord_fixed(1.4) +
  theme_void()


## -----------------------------------------------------------------------------
USArrests |> slice_head(n=3)

mymap |> slice_head(n=3)


## -----------------------------------------------------------------------------
# convert county name to lower case
USArrests$State=tolower(USArrests$State)

# combine data with left_join
mymap_comb = left_join(mymap, USArrests, 
                     by=c('region'='State'))

mymap_comb |> slice_head(n=3)


## ----out.width='30%'----------------------------------------------------------
mymap_comb |>
  ggplot(aes(x=long,y=lat,group=group,
             fill=Murder)) +
  geom_polygon(color='darkblue') +
  coord_fixed(1.4) +
  theme_void() +
  labs(fill='Murder rate') +
  scale_fill_gradient(low="green", high="red")


## -----------------------------------------------------------------------------
#| echo: false

df.student = 
  data.frame(name=c('A','B','C','D'),
             exam=c(80,91,85,78),
             project=c(1,2,1,NA))

df.project =
  data.frame(projectID = c(1:3),
             description = c('visualization','classification','text mining'))


## -----------------------------------------------------------------------------
df.student
df.project


## ----echo=T,eval=F------------------------------------------------------------
# inner_join(df.student, df.project, by=c('project' = 'projectID'))
# left_join(df.student, df.project, by=c('project' = 'projectID'))
# left_join(df.project, df.student, by=c('projectID' = 'project'))
# right_join(df.student, df.project, by=c('project' = 'projectID'))
# full_join(df.student, df.project, by=c('project' = 'projectID'))

