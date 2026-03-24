import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button, Drawer } from 'antd';
import { FilterOutlined, ClearOutlined } from '@ant-design/icons';
import { getProviders } from '../api';
import styles from './FilterBar.module.css';

const { Search } = Input;

export interface FilterValues {
  providers?: string;
  keyword?: string;
  location?: string;
}

interface FilterBarProps {
  onFilterChange: (filters: FilterValues) => void;
}

const FilterBar: React.FC<FilterBarProps> = ({ onFilterChange }) => {
  const { t } = useTranslation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [providerOptions, setProviderOptions] = useState<{label: string, value: string}[]>([]);
  const [drawerVisible, setDrawerVisible] = useState(false);

  // Filter States
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');

  const triggerSearch = (
    newProviders = selectedProviders,
    newKeyword = keyword,
    newLocation = location,
  ) => {
    const normalizedKeyword = newKeyword.trim();
    const normalizedLocation = newLocation.trim();

    onFilterChange({
      providers: newProviders.length > 0 ? newProviders.join(',') : undefined,
      keyword: normalizedKeyword || undefined,
      location: normalizedLocation || undefined,
    });
  };

  useEffect(() => {
    const loadProviders = async () => {
      try {
        const res = await getProviders();
        if (res.data && res.data.code === 0 && res.data.data) {
          const options = res.data.data.map((provider: string) => ({ label: provider, value: provider }));
          setProviderOptions(options);
        }
      } catch (err) {
        console.error('Failed to fetch providers', err);
      }
    };

    void loadProviders();
  }, []);

  const handleProviderChange = (value: string[]) => {
    setSelectedProviders(value);
    triggerSearch(value, keyword, location);
  };

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (value.trim() === '') {
      triggerSearch(selectedProviders, '', location);
    }
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim() === '') {
      triggerSearch(selectedProviders, keyword, '');
    }
  };

  const clearFilters = () => {
    setSelectedProviders([]);
    setKeyword('');
    setLocation('');
    setDrawerVisible(false);
    onFilterChange({});
  };

  const filterContent = (
    <div className={`${isMobile ? styles.mobileContent : styles.desktopContent} glass-panel`} style={{
      padding: '20px 24px',
      borderRadius: 20,
      marginBottom: 24,
      border: '1px solid rgba(255, 255, 255, 0.6)',
    }}>
      <div className={styles.filterItem}>
        <div className={styles.label}>{t('filter.provider')}</div>
        <Select
          mode="multiple"
          allowClear
          placeholder={t('filter.providerPlaceholder')}
          value={selectedProviders}
          onChange={handleProviderChange}
          options={providerOptions}
          style={{ minWidth: isMobile ? '100%' : '200px' }}
          maxTagCount="responsive"
          size="large"
          className="glass-selector"
        />
      </div>

      <div className={styles.filterItem}>
        <div className={styles.label}>{t('filter.keyword')}</div>
        <Search
          placeholder={t('filter.keywordPlaceholder')}
          allowClear
          onSearch={(val) => {
            const normalizedValue = val.trim();
            setKeyword(normalizedValue);
            triggerSearch(selectedProviders, normalizedValue, location);
          }}
          value={keyword}
          onChange={(e) => handleKeywordChange(e.target.value)}
          style={{ minWidth: isMobile ? '100%' : '200px' }}
          size="large"
        />
      </div>

      <div className={styles.filterItem}>
        <div className={styles.label}>{t('filter.location')}</div>
        <Search
          placeholder={t('filter.locationPlaceholder')}
          allowClear
          onSearch={(val) => {
            const normalizedValue = val.trim();
            setLocation(normalizedValue);
            triggerSearch(selectedProviders, keyword, normalizedValue);
          }}
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          style={{ minWidth: isMobile ? '100%' : '200px' }}
          size="large"
        />
      </div>

      <div className={styles.actionItem} style={{ marginLeft: isMobile ? 0 : 'auto' }}>
        <Button 
          icon={<ClearOutlined />} 
          onClick={clearFilters}
          className={isMobile ? styles.fullWidthBtn : ''}
          size="large"
          style={{ borderRadius: 10 }}
        >
          {t('filter.clear')}
        </Button>
      </div>
    </div>
  );

  return (
    <div className={styles.container}>
      {isMobile ? (
        <>
          <Button 
            type="primary" 
            icon={<FilterOutlined />} 
            onClick={() => setDrawerVisible(true)}
            size="large"
            block
            style={{ marginBottom: 24, height: 52, borderRadius: 16, fontSize: 16, fontWeight: 600, background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', border: 'none' }}
          >
            {t('filter.filter')}
          </Button>
          <Drawer
            title={<><FilterOutlined style={{marginRight: 8}}/>{t('filter.filter')}</>}
            placement="bottom"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            height="auto"
            styles={{ body: { padding: 0 } }}
          >
            <div style={{ padding: '24px 16px' }}>{filterContent}</div>
          </Drawer>
        </>
      ) : (
        filterContent
      )}
    </div>
  );
};

export default FilterBar;

