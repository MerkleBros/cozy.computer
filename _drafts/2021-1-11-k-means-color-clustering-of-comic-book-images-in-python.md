---
layout: post
title:  "K-means color clustering of comic book images in Python"
date:   2021-1-11
draft: true
---
[Project on Github](https://github.com/MerkleBros/generative-art-from-comic-color-schemes)
TLDR: [K-means clustering](https://en.wikipedia.org/wiki/K-means_clustering) can be performed on images to group pixels into color clusters where a cluster is represented by an average color called the cluster's centroid. This code fits 1-10 clusters to an image and saves pie charts showing those centroids. These centroids represent approximate color schemes for the processed image. Later work will use these color schemes for generative art.

Example input image from [Redlands](https://imagecomics.com/comics/series/redlands) by colorist [Jordie Bellaire](https://en.wikipedia.org/wiki/Jordie_Bellaire):

![example input image of colored comic](path "opt title")

Output pie charts showing k-means color clusters (1-10 clusters):

![example output image of 10 pie charts](path "opt title")

## Background
In the last year I've gotten into reading comic books again and one thing that I really love about comics is their amazing color schemes. People don't give [comic book colorists](https://en.wikipedia.org/wiki/Colorist) much love - although [maybe this is changing](https://www.dailydot.com/news/comic-colorist-appreciation-day/).

I wanted to make a personal tool to approximate the dominant colors in a comic book panel and make interesting color schemes out of them. This gives me an excuse to:
- Find and [savour](https://en.wikipedia.org/wiki/Savoring) comic book panels
- Show off the work of comic book colorists that I enjoy
- Generate fun color schemes for use in generative art

The tool would take an input image and return a color scheme or color schemes.

I found that lots of people ([1](https://sighack.com/post/image-based-palettes-using-k-means-clustering), [2](https://medium.com/analytics-vidhya/color-separation-in-an-image-using-kmeans-clustering-using-python-f994fa398454)) have done this already and that an image's color scheme is called its `palette`. The `k-means` algorithm is a popular one for generating palettes from an image.

## What is k-means?
The `k-means` algorithm is used to take data points and classify them into groups. The chosen number of groups or `clusters` to classify into is `k`. Each cluster is represented by an average (called the `mean` or `centroid`) of that group. Taken together you get `k-means` meaning k groups where each group (cluster) is represented by the mean (centroid) of that group.

`k-means` is often used for [image segmentation](https://www.kdnuggets.com/2019/08/introduction-image-segmentation-k-means-clustering.html). It is a simple and popular algorithm. It's unsupervised meaning input data is not labeled as belong to groups.

Steps to the `k-means` algorithm:
1. Choose the number of groups (`k`) to classify data into
2. Select `k` random points as the initial centroids
3. Assign each data point to its closest centroid
4. After assigning all data points to a centroid, compute that group's mean and assign that as the new centroid
5. Repeat steps 3-4 until none of the data points change their assigned centroid

[Here's a visualization of k-means clustering with k=4](https://miro.medium.com/max/700/1*ZmktlQtiZSp6p03op3EvyA.gif)
There's also `k-means++` which is an improvement over `k-means`. It doesn't randomly assign initial centroids because random initial centroids can sometimes cause the algorithm to fit incorrectly.

## Python code
To setup the environment for running the Python code follow the instructions on the [Github repository](https://github.com/MerkleBros/generative-art-from-comic-color-schemes).

### app.py
