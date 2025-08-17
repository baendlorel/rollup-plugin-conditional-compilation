# 如何用联合类型约束数组类型

<p align="center"><img src="https://p0-xtjj-private.juejin.cn/tos-cn-i-73owjymdk6/b4d99b54abfe4cb7becb794b3e435b35~tplv-73owjymdk6-jj-mark-v1:0:0:0:0:5o6Y6YeR5oqA5pyv56S-5Yy6IEAgS2FzdWthYmVUc3VtdWdp:q75.awebp?policy=eyJ2bSI6MywidWlkIjoiNDEzMjQxNjgwMTIyMzA3MiJ9&rk3s=f64ab15b&x-orig-authkey=f32326d3454f2ac7e96d3d06cdbb035152127018&x-orig-expires=1756078123&x-orig-sign=LC1uGs2inUyVihD%2FEvwCdMXfgG8%3D" alt="联合类型能转化为元组类型吗.png"></p>

TypeScript 类型体操中，我希望能用联合类型约束数组（或元组）类型，实现更强的类型安全。本文将围绕这个主题展开，介绍常见的思路、局限与解决方案。

## 1. 联合类型与元组类型的关系

我们知道，TypeScript 可以很容易地将元组类型转化为联合类型：

```typescript
const tuple = ['a', 'b', 'c'] as const; // as const 不能遗漏哦
type Union = (typeof tuple)[number]; // 'a' | 'b' | 'c'
```

但反过来，在进行了一些徒劳的尝试和资料查询后发现：

**无法直接将联合类型转化为元组类型**（；´д｀）ゞ。

因为联合类型本质上是无序的集合，而元组类型是有序的列表，TypeScript 类型系统无法保证顺序和长度。

## 2. 如何实现精准的类型约束

虽然不能直接将联合类型转为元组，但我们依然可以做到：

- 让数组的元素类型受联合类型约束
- 任何一方缺失都会在类型检查阶段暴露

## 3. 开始操作

假设这样一个场景，我们在做参数校验：

有一个如下的联合类型的入参。现在，我们要设定一个数组，使用`includes`方法来确定入参的有效性，但是入参类型可能会随着版本变化而变化，我们希望类型提示能帮助我们快速发现、更新。

```typescript
type InputVersion = 'latest' | 1 | 2;
```

1.  先给出想要的数组，以`as const`约束它并提取元组类型

```typescript
const v = ['latest', 1, 2] as const;
type ArrVersion = (typeof v)[number]; // 'latest' | 1 | 2
```

2.  对比类型`ArrVersion`和`InputVersion`是否相同

```typescript
type What = IsSameType<ArrVersion, InputVersion>;
```

3. 给一个变量显式声明此类型并赋值

```typescript
const what: What = 1; // 如果ArrVersion和InputVersion不一致，这行代码会因类型不匹配而报错。
// 严谨版本这里可以赋值为true，具体什么值都没有关系，选择自己喜欢的就好
```

> Note: 这个赋值语句将会在编译期间被打包工具terser消除，因其未使用过。所以无需担心最终结果多出赋值语句。 (o゜▽゜)o

## 4. 实现 `IsSameType` 工具类型

### 直观版本

从数学理论讲，关键字`extends`类似于“偏序关系”，因此对于偏序关系而言，只要`a ≤ b`和`b ≤ a`同时成立，那么就可以得到`a = b`。因此，我们以三元运算符来做到这件事，一个直接的想法是这样：

```typescript
// 这是直观版本，但不是最优，最优请见下方的“严谨版本”
type IsSameTypeIntuitionistic<A, B> = A extends B ? (B extends A ? 1 : 2) : 2;
```

> Note: 如果用`true`和`false`，那么此泛型工具会永远返回`boolean`类型从而失去判断能力。

> Note: 不使用`1`和`0`是因为`0`作为falsy的值性质略有区别，可能使得推断结果和约束行为不如预期。

### 严谨版本

TypeScript 存在“分布式展开”行为，当类型入参存在 `never` 时，分布式展开会直接返回 `never`，不会进入分支。以下是社区体操之神（ (＃°Д°)？）提供的严谨版本：

```typescript
// 严谨版本
type IsSameType<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
```

此写法阻止了“分布式展开”行为，边界情况都可以照顾到，适用范围更广。

## 总结

- 元组类型可以转为联合类型，但联合类型无法直接转为元组类型。
- 可以用联合类型约束数组元素类型，实现基本的类型安全。
- 进一步约束时，可以用 `IsSameType` 工具类型判断类型集合是否完全一致。

(❁´◡\`❁) 感谢你读到这里!
