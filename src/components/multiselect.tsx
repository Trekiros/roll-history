'use client';

import dynamic from 'next/dynamic';
import { JSX, useState } from 'react'
import { ClassNamesConfig } from 'react-select'
const ReactSelect = dynamic(() => import('react-select'), { ssr: false });
import styles from './multiselect.module.scss'

type PropType<T> = {
    value: T[],
    options: { value: T, label: string }[],
    onChange: (newValue: T[]) => void,
    className?: string,
}

const SelectStyles: ClassNamesConfig = {
    control: () => styles.control,
    input: () => styles.input,
    multiValue: () => styles.multiValue,
    multiValueLabel: () => styles.multiValueLabel,
    multiValueRemove: () => styles.multiValueRemove,
    menu: () => styles.menu,
    menuList: () => styles.menuList,
    option: ({ isSelected, isFocused }) => isSelected ? styles.isSelected : isFocused ? styles.isFocused : '',
    dropdownIndicator: () => styles.indicator,
    indicatorSeparator: () => styles.indicatorSeparator,
}

function getEntries<T>(options: {value: T, label: string}[], values: T[]) {
    return values.map(value => options.find(option => (option.value === value)))
}

const MultiSelect = <T,>({ value, options, onChange, className }: PropType<T>): JSX.Element => {
    const [search, setSearch] = useState('')

    return (
        <ReactSelect
            isMulti={true}
            className={`${styles.select} ${className}`}
            classNames={SelectStyles}
            options={options}
            value={getEntries(options, value)}
            onChange={(e: any) => !e ? null : onChange(e.map((option: {label: string, value: T}) => option.value))}
            inputValue={search}
            onInputChange={setSearch}
        />
    )
}

export default MultiSelect