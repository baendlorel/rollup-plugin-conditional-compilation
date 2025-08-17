# 如何用联合类型约束数组类型

TypeScript 类型体操中，很多人希望能用联合类型约束数组（或元组）类型，实现更强的类型安全。本文将围绕这个主题展开，介绍常见的思路、局限与解决方案。

## 1. 联合类型与元组类型的关系

我们知道，TypeScript 可以很容易地将元组类型转化为联合类型：

```typescript
type Tuple = ['a', 'b', 'c'] as const; // as const 不能遗漏哦
type Union = (typeof Tuple)[number]; // 'a' | 'b' | 'c'
```

但反过来，在进行了一些徒劳的尝试和资料查询后，发现**无法直接将联合类型转化为元组类型**。因为联合类型本质上是无序的集合，而元组类型是有序的列表，TypeScript 类型系统无法保证顺序和长度。

## 2. 退而求其次：如何实现类型约束

虽然不能直接将联合类型转为元组，但我们依然可以做到：

- 让数组的元素类型受联合类型约束
- 任何一方缺失都会在类型检查阶段暴露

## 3. 开始操作

假设这样一个场景，我们在做参数校验：

有一个如下的联合类型，我们要生成一个数组，使用`includes`方法来确定入参的有效性，但是入参类型可能会随着版本变化而变化，我们希望类型提示能帮助我们快速发现、更新。

```typescript
type InputVersion = 'latest' | 1 | 2;
```

1. 先给出想要的数组，以`as const`约束它

```typescript
const v = ['latest', 1, 2] as const;
```

2. `as const` 后，此数组将成为一个元组，将元组转化为联合类型

```typescript
type ArrVersion = (typeof v)[number]; // 'latest' | 1 | 2
```

3. 对比类型`ArrVersion`和`InputVersion`是否相同

```typescript
type What = IsSameType<ArrVersion, InputVersion>;
const what: What = 1; // 如果ArrVersion和InputVersion不一致，这行代码会报错
```

> Note: 这个赋值语句将会在编译期间被打包工具terser消除，因其未使用过。所以无需担心最终结果多出赋值语句。

## 4. 实现 `IsSameType` 工具类型

从数学理论讲，关键字`extends`类似于“偏序关系”，因此对于偏序关系而言，只要`a ≤ b`和`b ≤ a`同时成立，那么就可以得到`a = b`。因此，我们以三元运算符来做到这件事，一个直接的想法是这样：

```typescript
// 但这不是最优的，最优请见下方的“严谨版本”
type IsSameType<A, B> = A extends B ? (B extends A ? 1 : 2) : 2;
```

> Note: 如果用`true`和`false`，那么此泛型工具会永远返回`boolean`类型从而失去判断能力。

### 进阶严谨版本

TypeScript 存在“分布式展开”行为，当类型入参存在 `never` 时，分布式展开会直接返回 never，不会进入 `true/never` 分支。以下是社区体操之神提供的严谨版本：

```typescript
// 严谨版本
type IsSameTypeStrict<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
```

此写法阻止了“分布式展开”行为，适应范围更广。

## 总结

- 元组类型可以转为联合类型，但联合类型无法直接转为元组类型。
- 可以用联合类型约束数组元素类型，实现基本的类型安全。
- 进一步约束时，可以用 `IsSameType` 工具类型判断类型集合是否完全一致。
