"use client";

import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Input, Select, Button, Drawer, Badge } from "antd";
import { FilterOutlined, ClearOutlined } from "@ant-design/icons";
import styles from "./FilterBar.module.css";

const { Search } = Input;

export interface FilterValues {
  providers?: string;
  keyword?: string;
  location?: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterValues) => void;
  /** 服务端预取的服务商列表（SSG 首帧即含选项，无需客户端再请求）。 */
  initialProviders?: string[];
}

/**
 * 筛选栏（服务商多选、关键词、位置）。
 *
 * 响应式由 CSS 驱动（不再用 JS 读取 window.innerWidth）：
 * - 桌面（≥1200px）：内联筛选条 `.bar`，所有字段一行铺开。
 * - 移动 / 平板（<1200px）：一个「筛选」按钮触发底部 Drawer，字段纵向堆叠。
 *
 * 两种外壳同时渲染进 SSG HTML，用 globals.css 的 .desktopOnly / .mobileOnly
 * 按视口显隐，首帧即正确视图，无 hydration 闪烁。Drawer 的开关是纯交互态，
 * 与首屏无关，保留为客户端 state。
 */
const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange, initialProviders = [] }) => {
  const { t } = useTranslation();

  const providerOptions = initialProviders.map((provider) => ({
    label: provider,
    value: provider,
  }));
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Filter States
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [keyword, setKeyword] = useState("");
  const [location, setLocation] = useState("");

  const triggerSearch = (
    newProviders = selectedProviders,
    newKeyword = keyword,
    newLocation = location
  ) => {
    const normalizedKeyword = newKeyword.trim();
    const normalizedLocation = newLocation.trim();

    onFilterChange({
      providers: newProviders.length > 0 ? newProviders.join(",") : undefined,
      keyword: normalizedKeyword || undefined,
      location: normalizedLocation || undefined,
    });
  };

  const handleProviderChange = (value: string[]) => {
    setSelectedProviders(value);
    triggerSearch(value, keyword, location);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (value.trim() === "") {
      triggerSearch(selectedProviders, "", location);
    }
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim() === "") {
      triggerSearch(selectedProviders, keyword, "");
    }
  };

  const clearFilters = () => {
    setSelectedProviders([]);
    setKeyword("");
    setLocation("");
    setDrawerVisible(false);
    onFilterChange({});
  };

  // 当前已激活的筛选条件数量，用于移动端按钮上的徽标提示。
  const activeCount =
    (selectedProviders.length > 0 ? 1 : 0) +
    (keyword.trim() ? 1 : 0) +
    (location.trim() ? 1 : 0);

  // 字段集合：桌面（横向 `.bar`）与移动 Drawer（纵向 `.mobileContent`）共用同一组控件，
  // 仅外壳与布局类不同。selectWidth 通过 prop 决定每项输入宽度。
  const renderFields = (stacked: boolean) => {
    const itemWidth = stacked ? "100%" : "200px";
    return (
      <>
        <div className={styles.filterItem}>
          <div className={styles.label}>{t("filter.provider")}</div>
          <Select
            mode="multiple"
            allowClear
            placeholder={t("filter.providerPlaceholder")}
            value={selectedProviders}
            onChange={handleProviderChange}
            options={providerOptions}
            style={{ minWidth: itemWidth }}
            maxTagCount="responsive"
            size="large"
          />
        </div>

        <div className={styles.filterItem}>
          <div className={styles.label}>{t("filter.keyword")}</div>
          <Search
            placeholder={t("filter.keywordPlaceholder")}
            allowClear
            onSearch={(val) => {
              const normalizedValue = val.trim();
              setKeyword(normalizedValue);
              triggerSearch(selectedProviders, normalizedValue, location);
            }}
            value={keyword}
            onChange={(e) => handleKeywordChange(e.target.value)}
            style={{ minWidth: itemWidth }}
            size="large"
          />
        </div>

        <div className={styles.filterItem}>
          <div className={styles.label}>{t("filter.location")}</div>
          <Search
            placeholder={t("filter.locationPlaceholder")}
            allowClear
            onSearch={(val) => {
              const normalizedValue = val.trim();
              setLocation(normalizedValue);
              triggerSearch(selectedProviders, keyword, normalizedValue);
            }}
            value={location}
            onChange={(e) => handleLocationChange(e.target.value)}
            style={{ minWidth: itemWidth }}
            size="large"
          />
        </div>

        <div className={styles.actionItem} style={{ marginLeft: stacked ? 0 : "auto" }}>
          <Button
            icon={<ClearOutlined />}
            onClick={clearFilters}
            className={stacked ? styles.fullWidthBtn : ""}
            size="large"
          >
            {t("filter.clear")}
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className={styles.container}>
      {/* 桌面：内联筛选条 */}
      <div className={`${styles.bar} desktopOnly`}>{renderFields(false)}</div>

      {/* 移动 / 平板：按钮触发底部 Drawer */}
      <div className="mobileOnly" style={{ marginBottom: 16 }}>
        <Badge count={activeCount} offset={[-4, 4]} size="small">
          <Button
            type="primary"
            icon={<FilterOutlined />}
            onClick={() => setDrawerVisible(true)}
            size="large"
            block
            style={{ height: 48 }}
          >
            {t("filter.filter")}
          </Button>
        </Badge>
      </div>

      <Drawer
        title={
          <>
            <FilterOutlined style={{ marginRight: 8 }} />
            {t("filter.filter")}
          </>
        }
        placement="bottom"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        /* AntD 6 弃用了 `height`（改用 `size`，但 size 仅 default/large 两档固定值）。
           底部抽屉让高度自适应内容即可，故不再传 height。 */
        styles={{ body: { padding: 0 } }}
      >
        <div className={styles.mobileContent}>{renderFields(true)}</div>
      </Drawer>
    </div>
  );
};

export default FilterBar;
