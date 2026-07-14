---
title:      "机器学习结果诊断"
subtitle:   " \"我们该如何选择超参数?\""
date:       2025-03-07 20:00:00
author:     "Summer"
banner_img: /img/head/image6.jpg
index_img: /img/post-cover/diagnosing-ml-results.png
math: true
tags:
    - 科研
    - Machine Learning
categories: 科研
excerpt: "我们该如何选择超参数?"
---

现在, 我们已经学习了最最基础的机器学习, 完成了线性回归与逻辑回归.

不过, 回顾之前的模型, 我们会发现, 在许多程序里我们用到了一些奇怪的参数, 例如<span style="color:blue">学习率 $w$ </span>, <span style="color:blue">正则化参数 $\lambda$ </span> 等等,这些参数的大小通常无法根据程序和数据确定, 需要工程师自行选择. 

这些参数就叫做 <span style="font-size: 110%;">**超参数(hyperparameters)**</span>, 指的是在模型训练前由人工设定的参数（如学习率、正则化系数等）, 而不是通过训练数据学习得到的. 

在实际训练中, 超参数直接影响模型的性能和泛化能力. 

例如, 我们已经构建了一个正则化回归的模型来预测房价, 但是在测试集上不能得到满意的结果. 现在我们有如下处理方案:

1. 获取更多的训练样本
2. 减少所使用的特征个数
3. 获取额外的特征
4. 添加高次特征（$x_{1}^2$ ，$x_2^2$，$x_1 x_2$等等）
5. 降低正则化参数λ
6. 增加正则化参数λ

我们当然不能一拍脑袋就采用哪几个方法处理他们, 事实上, 有一些诊断机器学习结果的方法. 

## 一、无超参数时对假设进行评估

如果我们只有训练数据集，就无法估计该模型在测试数据集上的准确率。比如说，过拟合的时候，在训练集上的损失很低，但在新测试数据集上的损失会很高。

所以在没有学习率等超参数的情况下, 我们可以把数据集随机分为两部分：训练集（70%）和测试集（30%）。

这时候我们可以通过两步来训练算法：
1. 从训练集中学习使得损失函数最小化的 $\overrightarrow w$
2. 计算该 $ \overrightarrow w$ 在测试集上的损失（模型的评估结果）

下面以线性回归为例，给出使用`scikit-learn`库实现数据集划分、模型训练和评估的 Python 代码：

```Python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt

# 生成一些示例数据
np.random.seed(42)
X = np.random.rand(100, 1)  # 100个样本，每个样本有1个特征
y = 2 * X + 1 + 0.5 * np.random.randn(100, 1)  # 真实的线性关系加上一些噪声

# 将数据集划分为训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.3, random_state=42)

# 创建线性回归模型
model = LinearRegression()

# 从训练集中学习使得损失函数最小化的参数
model.fit(X_train, y_train)

# 计算模型在测试集上的预测值
y_pred = model.predict(X_test)

# 计算模型在测试集上的损失（均方误差）
test_loss = mean_squared_error(y_test, y_pred)
print(f"模型在测试集上的均方误差: {test_loss}")

# 绘制训练集数据点
plt.scatter(X_train, y_train, color='blue', label='Training data')
# 绘制测试集数据点
plt.scatter(X_test, y_test, color='green', label='Testing data')

# 绘制拟合的直线
x_line = np.linspace(0, 1, 100).reshape(-1, 1)
y_line = model.predict(x_line)
plt.plot(x_line, y_line, color='red', label='Fitted line')

plt.xlabel('X')
plt.ylabel('y')
plt.title('Data Points and Fitted Linear Relationship')
plt.legend()
plt.show()
```

示例图如下

![无超参数](/techblog/img/in-post/post-hyperparameter/Figure_1.png)




## 二、有超参数时对假设进行评估

对于一个要解决的问题，假设函数应该是几次幂才好呢？



1. \( h_w(x) = w_0 + w_1 x \)  
2. \( h_w(x) = w_0 + w_1 x + w_2 x^2 \)  
3. \( h_w(x) = w_0 + w_1 x + \cdots + w_3 x^3 \)  
 $ \cdots $  
10. \( h_w(x) = w_0 + w_1 x + \cdots + w_{10} x^{10} \)

如果我们对每一个假设函数都用梯度下降的方法在训练集上训练出合适的 $ \overrightarrow w$ ，然后对每一个 $ w $ ，求它在测试集上的损失，选出在测试集上损失最小的，比如选出最高次为5的模型。

这个方法看起来不错的吧？但是我们并不知道这个模型能否推广到新的样本（我们选了已有数据中最好的，那么这些数据就不能公平地评价该模型了）。

所以这次我们要把数据集随机分为三部分（因为有最高次幂这个超参数的存在）：训练集（60%）、验证集（20%）、测试集（20%）。

这时候需要三步来训练你的算法：
1. 对每一个假设函数，在训练集中训练出合适的 $ \overrightarrow w $
2. 计算各个 $ w $ 在验证集中的损失，选择使损失最小的那个假设函数
3. 计算该假设函数的 $ \overrightarrow w $ 在测试集上的损失（这就是模型的最终评估）



关键在于使用 `from sklearn.model_selection import train_test_split` 

* **train_test_split** 基本语法
```Python
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
```
  - `X` 是原特征矩阵,`y` 是原目标矩阵,
  - `X_train` 和 `y_train` 分别是训练集的特征和标签
  - `test_size=0.2` 意思是该参数用于指定测试集占总数据集的比例; 如果是`浮点数`，则表示测试集占总样本数的比例；如果是`整数`，则表示测试集的样本数量
  - `random_state=42` 同样是随机数种子，保证每次运行代码时数据划分的结果相同

以下是一个使用 `scikit-learn` 库实现上述方法的 Python 代码示例：

```Python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import PolynomialFeatures # 多项式回归
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt

# 设置 matplotlib 支持中文显示
plt.rcParams['font.family'] = ['SimHei']  # 使用黑体字体，不同系统可能字体名称不同
# 解决负号显示为方块的问题
plt.rcParams['axes.unicode_minus'] = False

# 生成一些示例数据
np.random.seed(42)
X = np.random.rand(100, 1)  # 100个样本，每个样本有1个特征
y = 2 * X + 1 + 0.5 * np.random.randn(100, 1)  # 真实的线性关系加上一些噪声

# 将数据集划分为训练集、验证集和测试集
X_train_val, X_test, y_train_val, y_test = train_test_split(X, y, test_size=0.2, random_state=42) # 
X_train, X_val, y_train, y_val = train_test_split(X_train_val, y_train_val, test_size=0.25, random_state=42)

# 定义假设函数的最高次幂范围
max_degrees = 10
validation_losses = []
best_degree = 0
best_model = None

# 遍历不同的最高次幂
for degree in range(1, max_degrees + 1):
    # 创建多项式特征
    poly_features = PolynomialFeatures(degree=degree, include_bias=False)
    X_train_poly = poly_features.fit_transform(X_train)
    X_val_poly = poly_features.transform(X_val)

    # 创建线性回归模型
    model = LinearRegression()

    # 在训练集上训练模型
    model.fit(X_train_poly, y_train)

    # 在验证集上进行预测
    y_val_pred = model.predict(X_val_poly)

    # 计算验证集上的损失
    val_loss = mean_squared_error(y_val, y_val_pred)
    validation_losses.append(val_loss)

    # 选择使验证集损失最小的假设函数
    if val_loss == min(validation_losses):
        best_degree = degree
        best_model = model

# 输出最佳假设函数的最高次幂
print(f"最佳假设函数的最高次幂: {best_degree}")

# 使用最佳模型在测试集上进行评估
poly_features = PolynomialFeatures(degree=best_degree, include_bias=False)
X_test_poly = poly_features.fit_transform(X_test)
y_test_pred = best_model.predict(X_test_poly)
test_loss = mean_squared_error(y_test, y_test_pred)
print(f"最佳模型在测试集上的均方误差: {test_loss}")

# 绘制验证集损失随最高次幂的变化曲线
plt.plot(range(1, max_degrees + 1), validation_losses, marker='o')
plt.xlabel("最高次幂")
plt.ylabel("验证集均方误差")
plt.title("验证集损失随最高次幂的变化")
plt.show()
```

我们得到验证集损失随最高次幂的变化曲线

![验证集损失随最高次幂的变化曲线](/techblog/img/in-post/post-hyperparameter/Figure_2.png)


由此我们得到

最佳假设函数的最高次幂: 2

最佳模型在测试集上的均方误差: 0.1602831714239093

## 三、过拟合还是欠拟合

分别画出$J_{训练}(θ)$和$J_{验证}(θ)$随模型复杂度的变化而变化的图像，可以发现在欠拟合的情况下（图的左边）$J_{训练}(θ)$和$J_{验证}(θ)$都很高（一般验证集的损失都会高于训练集的损失）, 因为该模型在两个训练集上都无法很好拟合数据；而在过拟合的情况下（图的右边），J训练(θ)很低，J验证(θ)很高，因为模型过于考虑现有的训练集而不考虑新的数据集（验证集）。

所以，如果算法的训练集和验证集的损失都很大的话，算法就是欠拟合，要增加（高次）特征；如果训练集损失小而验证集损失大的话，算法处于过拟合的状态，要减少特征的使用。


> 正在施工




