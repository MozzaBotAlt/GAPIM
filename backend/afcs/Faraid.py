from HeirsDict import *
from fractions import Fraction as fra
from Functions import *
import os

S_value = 0
asabah = 0
pos = 0

def faraid():  # sourcery skip: none-compare, simplify-boolean-comparison
# If deceased is Female, remove "Wife" key from female dictionary, If deceased is Male, remove "Husband" key from male dictionary #

    print("Copyright (C) 2025  NUR AIN SYAFIQAH BINTI MOHAMMAD MARZUKI, This program comes with ABSOLUTELY NO WARRANTY. This is free software, and you are welcome to redistribute it under certain conditions. ")
    print('')
    
    gender = input_gender("Insert deceased gender (F / M) : ")

    if gender == "M":
        male_heirs.pop("Husband")
        heirs_number["Husband"] = 0
    else:
        female_heirs.pop("Wife")
        heirs_number["Wife"] = 0

    net_asset = round(getNetAsset(), 2)

    _extracted_from_faraid_15(
        "\n---INSERT STATUS OF MALE HEIRS ---",
        "             (1 - ALIVE) ",
        "             (0 - DEAD)",
        "====================================",
    )
    for k in male_heirs:
        if male_heirs[k] == None:
            answer = bool(int(status_input(f"{k.upper()} --> 1- Alive, 0- Dead : ")))
            male_heirs[k] = answer

            if answer is False: heirs_number[k] = 0
            # elif answer is True and k == "Husband": heirs_number["Husband"] = 1

    _extracted_from_faraid_15(
        "\n---INSERT STATUS OF FEMALE HEIRS ---",
        "              (1 - ALIVE) ",
        "              (0 - DEAD) ",
        "======================================",
    )
    for j in female_heirs:
        if female_heirs[j] == None:
            answer = bool(int(status_input(f"{j.upper()} --> 1- Alive, 0- Dead : ")))
            female_heirs[j] = answer

        if answer is False: heirs_number[j] = 0

        print("\n---INSERT NUMBER OF ALIVE HEIRS ---")
        print("=====================================")
    for l in heirs_number:
        if heirs_number[l] == -1:
            num = input_num(f"Number of {l.upper()} : ")
            heirs_number[l] = num

    ## If all heirs are alive ##
    if all(male_heirs.values()) and all(female_heirs.values()):
        _extracted_from_faraid_47(gender, net_asset)
    elif all(male_heirs.values()) and not all(female_heirs.values()) and not any(female_heirs.values()):

        _extracted_from_faraid_88(gender, net_asset)
    elif all(female_heirs.values()) and not all(male_heirs.values()) and not any(male_heirs.values()):
        _extracted_from_faraid_114(gender, net_asset)
    else:
        _extracted_from_faraid_150(gender, net_asset)


# TODO Rename this here and in `faraid`
def _extracted_from_faraid_150(gender, net_asset):
    # sourcery skip: low-code-quality
    ###  Rules for Male heirs  ###
    if gender == "F" and male_heirs["Husband"] is True:
        if no_descent_downward():
            portion["Husband"] = 1/2

        elif has_descent_downward():
            portion["Husband"] = 1/4

    if male_heirs["Father"] is True and has_descent_downward():
        portion["Father"] = 1/6

    if male_heirs["Grandfather Father Side"] is True and (has_descent_downward() and (male_heirs["Father"] is False and male_heirs["Brother"] is False and \
                    female_heirs["Sister"] is False and male_heirs["Stepbrother Same Father"] and \
                    female_heirs["Stepsister Same Mother"] is False)):
        portion["Grandfather Father Side"] = 1/6

    if male_heirs["Stepbrother Same Mother"] is True:
        if no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            (heirs_number["Stepbrother Same Mother"] == 1 or heirs_number["Stepsister Same Mother"] == 1):
            portion["Stepbrother Same Mother"] = 1/6

        elif no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            (heirs_number["Stepbrother Same Mother"] > 1 or heirs_number["Stepsister Same Mother"] > 1):
            portion["Stepbrother Same Mother"] = 1/3


    # ###  Rules for Female heirs  ###
    if female_heirs["Daughter"] is True:
        if male_heirs["Son"] is False and heirs_number["Daughter"] == 1:
            portion["Daughter"] = 1/2

        elif male_heirs["Son"] is False and heirs_number["Daughter"] > 1:
            portion["Daughter"] = 2/3

    if female_heirs["Granddaughter"] is True:
        if male_heirs["Son"] is False and male_heirs["Grandson"] is False and \
            female_heirs["Daughter"] is False and heirs_number["Granddaughter"] == 1:
            portion["Granddaughter"] = 1/2

        elif male_heirs["Son"] is False and male_heirs["Grandson"] is False and \
            female_heirs["Daughter"] is False and heirs_number["Granddaughter"] > 1:
            portion["Granddaughter"] = 2/3

        elif male_heirs["Son"] is False and male_heirs["Grandson"] is False and \
            heirs_number["Daughter"] == 1:
            portion["Granddaughter"] = 1/6

    if female_heirs["Sister"] is True:
        if no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            male_heirs["Brother"] is False and heirs_number["Sister"] == 1:
            portion["Sister"] = 1/2

        elif no_descent_downward() and (male_heirs["Father"] is False or male_heirs["Grandfather Father Side"] is False) and \
            male_heirs["Brother"] is False and heirs_number["Sister"] > 1:
            portion["Sister"] = 2/3

    if female_heirs["Stepsister Same Father"] is True:
        if no_descent_downward() and (male_heirs["Father"] is False or male_heirs["Grandfather Father Side"] is False) and \
            male_heirs["Brother"] is False and female_heirs["Sister"] is False and \
            male_heirs["Stepbrother Same Father"] is False and heirs_number["Stepsister Same Father"] == 1:
            portion["Stepsister Same Father"] = 1/2

        elif no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            (female_heirs["Sister"] is False or male_heirs["Brother"] is False) and \
            male_heirs["Stepbrother Same Father"] is False and heirs_number["Stepsister Same Father"] > 1:
            portion["Stepsister Same Father"] = 2/3

        elif no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            male_heirs["Brother"] is False and male_heirs["Stepbrother Same Father"] is False and \
            heirs_number["Sister"] == 1:
            portion["Stepsister Same Father"] = 1/6

    if female_heirs["Mother"] is True:
        if no_descent_downward() and male_heirs["Brother"] is False and female_heirs["Sister"] is False:
            portion["Mother"] = 1/3

        elif has_descent_downward() or male_heirs["Brother"] is True or female_heirs["Sister"] is True:
            portion["Mother"] = 1/6

    if gender == "M" and female_heirs["Wife"] is True:
        if no_descent_downward():
            portion["Wife"] = 1/4

        elif has_descent_downward():
            portion["Wife"] = 1/8

    if female_heirs["Grandmother Father Side"] is True and (male_heirs["Father"] is False and female_heirs["Mother"] is False):
        portion["Grandmother Father Side"] = 1/6

    if female_heirs["Grandmother Mother Side"] is True and female_heirs["Mother"] is False:
        portion["Grandmother Mother Side"] = 1/6

    if female_heirs["Stepsister Same Mother"] is True:
        if no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            (heirs_number["Stepbrother Same Mother"] == 1 or heirs_number["Stepsister Same Mother"] == 1):
            portion["Stepsister Same Mother"] = 1/6

        if no_descent_downward() and male_heirs["Father"] is False and male_heirs["Grandfather Father Side"] is False and \
            (heirs_number["Stepbrother Same Mother"] > 1 or heirs_number["Stepsister Same Mother"] > 1):
            portion["Stepsister Same Mother"] = 1/3

    # Calculate inheritance amount to get asabah value
    S_value = sum(portion.values())
    cumulative = 0
    print(f"Total Portion Value is : {fra(S_value).limit_denominator(10)} or {round(S_value, 2)}")
    while True:
        if S_value <=1 :
            for i in portion:
                if portion[i] != 0:
                    try:
                        amount[i] = (portion[i] * net_asset) / heirs_number[i]
                        cumulative += amount[i]
                    except ZeroDivisionError:
                        amount[i] = 0
            break
        else:
            temp = S_value
            S_value = 0
            for i in portion:
                if portion[i] != 0:
                    portion[i] = portion[i] / temp
                    S_value += portion[i]
            continue

    asabah = net_asset - cumulative
    ### Rules for Asabah and Hijab ###
    if male_heirs["Son"] is True:
        if heirs_number["Son"] == 1:
            amount["Son"] = asabah
        if heirs_number["Son"] > 1 and female_heirs["Daughter"] is False:
            amount["Son"] = asabah / heirs_number["Son"]
        if female_heirs["Daughter"] is True:
            _extracted_from__extracted_from_faraid_150_134("Son", "Daughter", asabah)
    if male_heirs["Son"] is False and male_heirs["Grandson"] is False and female_heirs["Daughter"] is False:
        if male_heirs["Father"] is True:
            amount["Father"] = asabah
        if male_heirs["Grandfather Father Side"] is True:
            amount["Grandfather Father Side"] = asabah

    if male_heirs["Son"] is False and male_heirs["Grandson"] is False and (female_heirs["Daughter"] is True or female_heirs["Granddaughter"] is True):
        if male_heirs["Father"] is True:
            amount["Father"] = 1/6 * net_asset + asabah
        if male_heirs["Grandfather Father Side"] is True:
            amount["Grandfather Father Side"] = 1/6 * net_asset + asabah

    if male_heirs["Grandson"] is True and male_heirs["Son"] is False:
        if female_heirs["Granddaughter"] is False:
            amount["Grandson"] = asabah / heirs_number["Grandson"]
        if female_heirs["Granddaughter"] is True:
            _extracted_from__extracted_from_faraid_150_134(
                "Grandson", "Granddaughter", asabah
            )
    if no_unobstructed_heirs():
        if male_heirs["Nephew"] is True:
            amount["Nephew"] = asabah
    elif no_unobstructed_heirs() or male_heirs["Nephew"] is False:
        if male_heirs["Nephew Same Father"] is True:
            amount["Nephew Same Father"] = asabah
    elif no_unobstructed_heirs() or male_heirs["Nephew"] is False and male_heirs["Nephew Same Father"] is False:
        if male_heirs["Uncle"] is True:
            amount["Uncle"] = asabah
    elif no_unobstructed_heirs() or male_heirs["Nephew"] is False and male_heirs["Nephew Same Father"] is False and male_heirs["Uncle"] is False:
        if male_heirs["Uncle Same Father"] is True:
            amount["Uncle Same Father"] = asabah
    elif no_unobstructed_heirs() or male_heirs["Nephew"] is False and male_heirs["Nephew Same Father"] is False and \
        male_heirs["Uncle"] is False and male_heirs["Uncle Same Father"] is False:
        if male_heirs["Male Cousin"] is True:
            amount["Male Cousin"] = asabah            
        elif male_heirs["Male Cousin Same Father"] is True:
            amount["Male Cousin Same Father"] = asabah

    if male_heirs["Brother"] is True and male_heirs["Son"] is False and male_heirs["Grandson"] is False \
        and male_heirs["Father"] is False and female_heirs["Daughter"] is True:
        amount["Brother"] = asabah

    if male_heirs["Stepbrother Same Father"] is True and male_heirs["Son"] is False and \
        male_heirs["Grandson"] is False and male_heirs["Father"] is False and male_heirs["Brother"] is False and \
        female_heirs["Sister"] is False:
        amount["Stepbrother Same Father"] = asabah

    if female_heirs["Sister"] is True and (male_heirs["Son"] is False and male_heirs["Father"] is False and \
        male_heirs["Grandson"] is False) and male_heirs["Brother"] is True and male_heirs["Grandfather Father Side"] is True and \
        (female_heirs["Daughter"] is True or female_heirs["Granddaughter"] is True):
        amount["Sister"] = asabah

    if female_heirs["Stepsister Same Father"] is True and (male_heirs["Son"] is False and male_heirs["Father"] is False and \
        male_heirs["Grandson"] is False) and (male_heirs["Stepbrother Same Father"] is True or \
        male_heirs["Grandfather Father Side"] is True or female_heirs["Daughter"] is True or female_heirs["Granddaughter"] is True):
        amount["Stepsister Same Father"] = asabah

    if female_heirs["Mother"] is True and male_heirs["Father"] is True and male_heirs["Son"] is False and \
                male_heirs["Grandson"] is False and ((gender == "F" and male_heirs["Husband"] is True) or (gender == "M" and female_heirs["Wife"] is True)):
        amount["Mother"] = 1/3 * asabah

    for i in amount:
        if amount[i] != 0:
            print(f"{i} portion {fra(portion[i]).limit_denominator(10)} x{heirs_number[i]}: RM{round(amount[i], 2)}")


# TODO Rename this here and in `_extracted_from_faraid_150`
def _extracted_from__extracted_from_faraid_150_134(arg0, arg1, asabah):
    denominator = heirs_number[arg0] * 2 + heirs_number[arg1]
    amount[arg0] = 2/denominator * asabah
    amount[arg1] = 1/denominator * asabah


# TODO Rename this here and in `faraid`
def _extracted_from_faraid_114(gender, net_asset):
    if gender == "M":
        portion["Wife"] = 1/8
        portion["Daughter"], portion["Mother"], portion["Granddaughter"] = 1/2, 1/6, 1/6

    S_value = sum(portion.values())
    print(f"Total Sum of Portion (Must less than 1): {fra(S_value).limit_denominator(10)} or {S_value}")

    while True:
        if S_value <= 1:
            try:
                amount["Wife"] = (portion["Wife"] * net_asset) / heirs_number["Wife"]
            except ZeroDivisionError:
                amount["Wife"] = 0
                amount["Daughter"], amount["Mother"] = (portion["Daughter"] * net_asset) / heirs_number["Daughter"], portion["Mother"] * net_asset
                amount["Granddaughter"] = (portion["Granddaughter"] * net_asset) / heirs_number["Granddaughter"]
                amount["Sister"] = (net_asset - (amount["Daughter"] * heirs_number["Daughter"]) - amount["Mother"] - \
                (amount["Wife"] * heirs_number["Wife"]) - (amount["Granddaughter"] * heirs_number["Granddaughter"])) / heirs_number["Sister"]
                break

        else:
            portion["Wife"] = portion["Wife"] / S_value
            portion["Mother"] = portion["Mother"] / S_value
            portion["Granddaughter"] = portion["Granddaughter"] / S_value
            S_value = portion["Mother"] + portion["Daughter"] + portion["Granddaughter"]
            continue

    print(f"Mother Portion ({fra(portion['Mother']).limit_denominator(10)}): RM{round(amount['Mother'], 2)}")
    print(f"Each Daughter Portion ({fra(portion['Daughter']).limit_denominator(10)}) x({heirs_number['Daughter']}): RM{round(amount['Daughter'], 2)}")
    print(f"Wife Portion ({fra(portion['Wife']).limit_denominator(10)}) x{heirs_number['Wife']}: RM{round(amount['Wife'], 2)}")
    print(f"Each Granddaughter Portion ({fra(portion['Granddaughter']).limit_denominator(10)}) x{heirs_number['Granddaughter']}: RM{round(amount['Granddaughter'], 2)}")
    print(f"Each Sister Portion x{heirs_number['Sister']}: RM{round(amount['Sister'], 2)}")


# TODO Rename this here and in `faraid`
def _extracted_from_faraid_88(gender, net_asset):
    if gender == "F":
        portion["Husband"] = 1/4
        portion["Father"] = 1/6

    S_value = sum(portion.values())
    print(f"Total Sum of Portion (Must less than 1): {fra(S_value).limit_denominator(10)} or {S_value}")

    while True:
        if S_value <= 1:
            amount["Husband"], amount["Father"] = portion["Husband"] * net_asset, portion["Father"] * net_asset
            asabah = net_asset - amount["Father"] - amount["Husband"]
            amount["Son"] = asabah / heirs_number["Son"]
            break

        else:
            portion["Father"] = portion["Father"] / S_value
            portion["Husband"] = portion["Husband"] / S_value
            S_value = portion["Father"] + portion["Husband"]
            continue

    print(f"\nFather Portion ({fra(portion['Father']).limit_denominator(10)}): RM", round(amount["Father"], 2))
    print(f"Husband Portion ({fra(portion['Husband']).limit_denominator(10)}): RM", round(amount["Husband"], 2))
    print(f"Each Son Portion x{heirs_number['Son']}: RM{round(amount['Son'], 2)}")


# TODO Rename this here and in `faraid`
def _extracted_from_faraid_47(gender, net_asset):
    portion["Father"], portion["Mother"] = 1/6, 1/6
    if gender == "F":
        portion["Husband"] = 1/4
    else:
        portion["Wife"] = 1/8

    S_value = sum(portion.values())
    print(f"Total Sum of Portion (Must less than 1): {fra(S_value).limit_denominator(10)} or {S_value}")

    while True:
        if S_value <= 1:
            amount["Father"], amount["Mother"], amount["Husband"] = portion["Father"] * net_asset, portion["Mother"] * net_asset, portion["Husband"] * net_asset
            try:
                amount["Wife"] = (portion["Wife"] * net_asset) / heirs_number["Wife"]
            except ZeroDivisionError:
                amount["Wife"] = 0
            asabah = net_asset - amount["Father"] - amount["Mother"] - amount["Husband"] - (amount["Wife"] * heirs_number["Wife"])
            denominator = heirs_number["Son"] * 2 + heirs_number["Daughter"]
            amount["Son"] = 2/denominator * asabah
            amount["Daughter"] = 1/denominator * asabah
            break

        else:
            portion["Father"] = portion["Father"] / S_value
            portion["Mother"] = portion["Mother"] / S_value
            portion["Husband"] = portion["Husband"] / S_value
            portion["Wife"] = portion["Wife"] / S_value
            S_value = portion["Father"] + portion["Mother"] + portion["Husband"] + portion["Wife"]
            continue

    print("===== INHERITANCE DISTRIBUTION =====")
    print("")
    print(f"\nFather Portion ({fra(portion['Father']).limit_denominator(10)}): RM", round(amount["Father"], 2))
    print(f"Mother Portion ({fra(portion['Mother']).limit_denominator(10)}): RM", round(amount["Mother"], 2))
    print(f"Husband Portion ({fra(portion['Husband']).limit_denominator(10)}): RM", round(amount["Husband"], 2))
    print(f"Each Wife Portion ({fra(portion['Wife']).limit_denominator(10)}) x{heirs_number['Wife']}: RM", round(amount["Wife"], 2))
    print(f"Each Son Portion x{heirs_number['Son']}: RM{round(amount['Son'], 2)}")
    print(f"Each Daughter Portion x{heirs_number['Daughter']}: RM{round(amount['Daughter'], 2)}")
    print("Total : RM", round((amount["Father"] + amount["Mother"] + amount["Husband"] + (amount["Wife"] * heirs_number["Wife"]) + (amount["Son"] * heirs_number["Son"]) + (amount["Daughter"] * heirs_number["Daughter"])), 2))

# TODO Rename this here and in `faraid`
def _extracted_from_faraid_15(arg0, arg1, arg2, arg3):
    # Input for dead or alive heirs
    print(arg0)
    print(arg1)
    print(arg2)
    print(arg3)

def calculate_faraid_api(gender, total_assets, debt, funeral, will, nazar, net_asset, heirs):
    """
    API version of Faraid calculation
    Returns JSON-serializable results instead of printing
    """
    from fractions import Fraction as fra
    
    # Reset global dictionaries
    global male_heirs, female_heirs, heirs_number, portion, amount, S_value, asabah
    
    # Re-import to reset state
    from HeirsDict import male_heirs as mh, female_heirs as fh, heirs_number as hn, portion as p, amount as a
    
    # Create working copies
    male_heirs = dict(mh)
    female_heirs = dict(fh)
    heirs_number = dict(hn)
    portion = dict(p)
    amount = dict(a)
    
    try:
        # Remove spouse based on deceased gender
        if gender == "M":
            if "Husband" in male_heirs:
                male_heirs.pop("Husband")
            heirs_number["Husband"] = 0
        else:
            if "Wife" in female_heirs:
                female_heirs.pop("Wife")
            heirs_number["Wife"] = 0
        
        # Initialize heirs from input
        for heir_name, count in heirs.items():
            if heir_name in male_heirs:
                male_heirs[heir_name] = True
                heirs_number[heir_name] = count
            elif heir_name in female_heirs:
                female_heirs[heir_name] = True
                heirs_number[heir_name] = count
        
        # Set non-selected heirs to False
        for heir_name in male_heirs:
            if male_heirs[heir_name] is None:
                male_heirs[heir_name] = False
        
        for heir_name in female_heirs:
            if female_heirs[heir_name] is None:
                female_heirs[heir_name] = False
        
        # Determine calculation path based on heir status
        if all(male_heirs.values()) and all(female_heirs.values()):
            _calculate_all_heirs(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount)
        elif all(male_heirs.values()) and not all(female_heirs.values()) and not any(female_heirs.values()):
            _calculate_male_only(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount)
        elif all(female_heirs.values()) and not all(male_heirs.values()) and not any(male_heirs.values()):
            _calculate_female_only(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount)
        else:
            _calculate_mixed(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount)
        
        # Format results
        result_heirs = {}
        for heir_name in amount:
            if amount[heir_name] > 0 and heir_name in heirs_number and heirs_number[heir_name] > 0:
                result_heirs[heir_name] = {
                    "amount": round(amount[heir_name], 2),
                    "portion": str(fra(portion[heir_name]).limit_denominator(10)) if portion[heir_name] > 0 else "0",
                    "count": heirs_number[heir_name],
                    "total": round(amount[heir_name] * heirs_number[heir_name], 2)
                }
        
        return {
            "success": True,
            "estate": {
                "total_assets": total_assets,
                "debt": debt,
                "funeral": funeral,
                "will": will,
                "nazar": nazar,
                "net_asset": net_asset
            },
            "heirs": result_heirs,
            "total_distributed": round(sum(h["total"] for h in result_heirs.values()), 2)
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def _calculate_all_heirs(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount):
    """Calculate when all heirs are present"""
    portion["Father"] = 1/6
    portion["Mother"] = 1/6
    if gender == "F":
        portion["Husband"] = 1/4
    else:
        portion["Wife"] = 1/8
    
    S_value = sum(portion.values())
    
    if S_value <= 1:
        amount["Father"] = portion["Father"] * net_asset
        amount["Mother"] = portion["Mother"] * net_asset
        if gender == "F":
            amount["Husband"] = portion["Husband"] * net_asset
        else:
            try:
                amount["Wife"] = (portion["Wife"] * net_asset) / heirs_number.get("Wife", 1)
            except:
                amount["Wife"] = 0
        
        asabah = net_asset - amount["Father"] - amount["Mother"] - amount.get("Husband", 0) - (amount.get("Wife", 0) * heirs_number.get("Wife", 1))
        if "Son" in heirs_number and "Daughter" in heirs_number and heirs_number.get("Son", 0) > 0:
            denominator = heirs_number["Son"] * 2 + heirs_number["Daughter"]
            amount["Son"] = 2/denominator * asabah
            amount["Daughter"] = 1/denominator * asabah
        else:
            amount["Son"] = asabah / max(heirs_number.get("Son", 1), 1)


def _calculate_male_only(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount):
    """Calculate when only male heirs are present"""
    if gender == "F":
        portion["Husband"] = 1/4
        portion["Father"] = 1/6
        amount["Husband"] = portion["Husband"] * net_asset
        amount["Father"] = portion["Father"] * net_asset
        asabah = net_asset - amount["Husband"] - amount["Father"]
        amount["Son"] = asabah / max(heirs_number.get("Son", 1), 1)


def _calculate_female_only(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount):
    """Calculate when only female heirs are present"""
    if gender == "M":
        portion["Wife"] = 1/8
        portion["Daughter"] = 1/2
        portion["Mother"] = 1/6
        portion["Granddaughter"] = 1/6
        amount["Wife"] = (portion["Wife"] * net_asset) / max(heirs_number.get("Wife", 1), 1)
        amount["Daughter"] = (portion["Daughter"] * net_asset) / max(heirs_number.get("Daughter", 1), 1)
        amount["Mother"] = portion["Mother"] * net_asset
        amount["Granddaughter"] = (portion["Granddaughter"] * net_asset) / max(heirs_number.get("Granddaughter", 1), 1)


def _calculate_mixed(gender, net_asset, male_heirs, female_heirs, heirs_number, portion, amount):
    """Calculate with mixed male and female heirs"""
    # Set portions based on Islamic law
    if gender == "F" and male_heirs.get("Husband"):
        if not any([male_heirs.get("Son"), male_heirs.get("Grandson"), female_heirs.get("Daughter"), female_heirs.get("Granddaughter")]):
            portion["Husband"] = 1/2
        else:
            portion["Husband"] = 1/4
    
    if male_heirs.get("Father") and any([male_heirs.get("Son"), male_heirs.get("Grandson"), female_heirs.get("Daughter"), female_heirs.get("Granddaughter")]):
        portion["Father"] = 1/6
    
    if female_heirs.get("Daughter"):
        if not male_heirs.get("Son") and heirs_number.get("Daughter", 0) == 1:
            portion["Daughter"] = 1/2
        elif not male_heirs.get("Son") and heirs_number.get("Daughter", 0) > 1:
            portion["Daughter"] = 2/3
    
    if female_heirs.get("Mother"):
        if not any([male_heirs.get("Son"), male_heirs.get("Grandson")]) and not male_heirs.get("Brother") and not female_heirs.get("Sister"):
            portion["Mother"] = 1/3
        else:
            portion["Mother"] = 1/6
    
    if gender == "M" and female_heirs.get("Wife"):
        if not any([male_heirs.get("Son"), male_heirs.get("Grandson"), female_heirs.get("Daughter"), female_heirs.get("Granddaughter")]):
            portion["Wife"] = 1/4
        else:
            portion["Wife"] = 1/8
    
    # Calculate amounts
    S_value = sum(portion.values())
    cumulative = 0
    
    if S_value <= 1:
        for heir in portion:
            if portion[heir] > 0 and heir in heirs_number and heirs_number[heir] > 0:
                amount[heir] = (portion[heir] * net_asset) / heirs_number[heir]
                cumulative += amount[heir] * heirs_number[heir]
    
    # Distribute remaining as asabah
    asabah = net_asset - cumulative
    if asabah > 0 and male_heirs.get("Son"):
        amount["Son"] = asabah / max(heirs_number.get("Son", 1), 1)
    elif asabah > 0 and male_heirs.get("Father"):
        amount["Father"] = portion.get("Father", 0) * net_asset + asabah